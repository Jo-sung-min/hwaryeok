package com.hwaryeok.photo;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import com.hwaryeok.user.ActiveUserService;
import tools.jackson.databind.ObjectMapper;

class SkinPhotoTest {
    final ObjectMapper mapper = new ObjectMapper();
    final OpenAiSkinPhotoClient client = new OpenAiSkinPhotoClient(mapper, "test-not-a-real-key", "gpt-4.1-mini", true);

    @Test void normalizesPngAndJpegInMemory() throws Exception {
        for (String format : List.of("PNG", "JPEG")) {
            var bytes = new ByteArrayOutputStream();
            ImageIO.write(new BufferedImage(1600, 800, BufferedImage.TYPE_INT_RGB), format, bytes);
            byte[] normalized = new SkinPhotoNormalizer().normalize(bytes.toByteArray());
            assertThat(normalized[0] & 255).isEqualTo(255);
            assertThat(normalized[1] & 255).isEqualTo(216);
            var decoded = ImageIO.read(new ByteArrayInputStream(normalized));
            assertThat(decoded.getWidth()).isEqualTo(1024);
            assertThat(decoded.getHeight()).isEqualTo(512);
        }
    }
    @Test void rejectsNonImageEmptyOversizedAndTinyImages() throws Exception {
        var normalizer = new SkinPhotoNormalizer();
        for (byte[] invalid : List.of(new byte[0], "<svg onload='alert(1)'/>".getBytes(), new byte[SkinPhotoNormalizer.MAX_BYTES + 1])) {
            assertThatThrownBy(() -> normalizer.normalize(invalid)).isInstanceOf(PhotoAnalysisException.class);
        }
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(128, 128, BufferedImage.TYPE_INT_RGB), "PNG", bytes);
        assertThatThrownBy(() -> normalizer.normalize(bytes.toByteArray())).isInstanceOf(PhotoAnalysisException.class);
    }
    @Test void defaultsToDisabledAndDoesNotTransmitPersonalIdentifiers() {
        assertThat(new OpenAiSkinPhotoClient(mapper, "", "gpt-4.1-mini", true).available()).isFalse();
        assertThat(new OpenAiSkinPhotoClient(mapper, "test", "gpt-4.1-mini", false).available()).isFalse();
        var payload = client.payload(new byte[] { 1, 2, 3 });
        assertThat(payload.get("store")).isEqualTo(false);
        String json = mapper.writeValueAsString(payload);
        assertThat(json).contains("input_image", "json_schema", "data:image/jpeg;base64,AQID", "\"strict\":true");
        assertThat(json).doesNotContain("test-not-a-real-key", "email", "user_id");
    }
    @Test void parsesStructuredObservationAndSuppressesRetakeObservations() {
        var report = Map.of("quality", "USABLE", "summary", "조명에 따라 피부가 반짝여 보여요.",
                "observations", List.of(Map.of("area", "이마", "appearance", "표면 광택이 보여요.", "caveat", "빛의 반사일 수 있어요.")),
                "careTips", List.of("자극 없는 세안을 유지해 주세요."), "limitations", "사진은 측정이나 진단이 아니에요.");
        assertThat(client.parse(response(report)).observations()).hasSize(1);
        var retake = new java.util.HashMap<String, Object>(report);
        retake.put("quality", "RETAKE");
        assertThat(client.parse(response(retake)).observations()).isEmpty();
        assertThat(client.parse(response(retake)).careTips()).isEmpty();
    }
    @Test void rejectsRefusalMalformedIncompleteAndMissingFields() {
        for (String body : List.of("not json", "{\"status\":\"incomplete\"}", response(Map.of("quality", "USABLE")),
                "{\"status\":\"completed\",\"output\":[{\"content\":[{\"type\":\"refusal\"}]}]}")) {
            assertThatThrownBy(() -> client.parse(body)).isInstanceOf(PhotoAnalysisException.class);
        }
    }
    @Test void checksConsentAndConfigurationBeforeReadingOrCallingProvider() throws Exception {
        var users = mock(ActiveUserService.class);
        var quota = mock(SkinPhotoQuota.class);
        var normalizer = mock(SkinPhotoNormalizer.class);
        var provider = mock(OpenAiSkinPhotoClient.class);
        var controller = new SkinPhotoController(users, normalizer, quota, provider);
        var jwt = Jwt.withTokenValue("test").header("alg", "none").subject("test-user").build();
        var request = new MockHttpServletRequest();
        assertThatThrownBy(() -> controller.analyze(jwt, "", request)).isInstanceOf(PhotoAnalysisException.class).hasMessageContaining("동의");
        assertThatThrownBy(() -> controller.analyze(jwt, "photo-v1", request)).isInstanceOf(PhotoAnalysisException.class).hasMessageContaining("준비");
        verifyNoInteractions(normalizer, quota);
        verify(provider, never()).analyze(any());
        clearInvocations(users, normalizer, quota, provider);
        when(provider.available()).thenReturn(true);
        when(normalizer.normalize(any())).thenReturn(new byte[] { 1 });
        controller.analyze(jwt, "photo-v1", request);
        var order = inOrder(users, normalizer, quota, provider);
        order.verify(users).requireActive("test-user");
        order.verify(normalizer).normalize(any());
        order.verify(quota).reserve("test-user");
        order.verify(provider).analyze(any());
    }
    private String response(Object report) {
        return mapper.writeValueAsString(Map.of("status", "completed", "output", List.of(Map.of("type", "message", "content", List.of(Map.of("type", "output_text", "text", mapper.writeValueAsString(report)))))));
    }
}
