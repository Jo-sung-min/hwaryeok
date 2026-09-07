package com.hwaryeok.usagevideo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class YoutubeLinksTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "https://www.youtube.com/watch?v=AbC_12345-6",
            "http://youtube.com/watch?v=AbC_12345-6&t=32s",
            "https://m.youtube.com/watch?list=PL123&v=AbC_12345-6",
            "https://youtu.be/AbC_12345-6?si=share",
            "https://www.youtu.be/AbC_12345-6/",
            "https://www.youtube.com/shorts/AbC_12345-6",
            "https://www.youtube.com/embed/AbC_12345-6/",
            "https://www.youtube.com/live/AbC_12345-6#t=10"
    })
    void normalizesSupportedVideoLinks(String url) {
        var result = YoutubeLinks.video(url);
        assertThat(result.id()).isEqualTo("AbC_12345-6");
        assertThat(result.url()).isEqualTo("https://www.youtube.com/watch?v=AbC_12345-6");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
            "javascript:alert(1)", "file:///etc/passwd", "https://example.com/watch?v=AbC_12345-6",
            "https://youtube.com.evil.test/watch?v=AbC_12345-6", "https://youtube.com@evil.test/watch?v=AbC_12345-6",
            "https://evil@youtube.com/watch?v=AbC_12345-6", "https://www.youtube.com:443/watch?v=AbC_12345-6",
            "//www.youtube.com/watch?v=AbC_12345-6", "ftp://youtube.com/watch?v=AbC_12345-6",
            "https://youtube.com/watch?v=short", "https://youtube.com/watch?v=AbC_12345-6&v=AbC_12345-6",
            "https://youtube.com/watch?v=AbC_12345%2D6", "https://youtube.com/redirect?q=https://evil.test",
            "https://youtube.com/playlist?list=PL123", "https://youtube.com/watch/extra?v=AbC_12345-6",
            "https://youtu.be/AbC_12345-6/extra", "https://youtube.com/embed/AbC_12345-6/extra",
            "https://www.youtube.com./watch?v=AbC_12345-6", "https://youtube.com/watch?v=AbC_12345-6%00"
    })
    void rejectsInvalidOrUnsafeVideoLinks(String url) {
        assertThatThrownBy(() -> YoutubeLinks.video(url)).isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://youtube.com/@beauty.creator", "https://www.youtube.com/@화력채널",
            "https://m.youtube.com/channel/UC1234567890123456789012", "https://youtube.com/c/BeautyChannel/",
            "https://www.youtube.com/user/BeautyChannel"
    })
    void acceptsOnlyCanonicalChannelDestinations(String url) {
        assertThat(YoutubeLinks.channel(url)).startsWith("https://www.youtube.com/").doesNotEndWith("/");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
            "http://youtube.com/@beauty", "https://youtube.com.evil.test/@beauty", "https://evil@youtube.com/@beauty",
            "https://youtube.com:443/@beauty", "https://youtu.be/AbC_12345-6", "https://youtube.com/",
            "https://youtube.com/watch?v=AbC_12345-6", "https://youtube.com/redirect?q=https://evil.test",
            "https://youtube.com/@beauty/videos", "https://youtube.com/@beauty?next=evil",
            "https://youtube.com/@beauty#next", "https://youtube.com/channel/UCshort", "https://youtube.com/@../evil",
            "https://youtube.com/@foo%2Fbar", "https://youtube.com/@foo%00bar"
    })
    void rejectsNonChannelAndUnsafeDestinations(String url) {
        assertThatThrownBy(() -> YoutubeLinks.channel(url)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void encodedKoreanHandlesRoundTripWithoutDoubleEncoding() {
        String canonical = YoutubeLinks.channel("https://youtube.com/@화력");
        assertThat(canonical).isEqualTo("https://www.youtube.com/@%ED%99%94%EB%A0%A5");
        assertThat(YoutubeLinks.channel(canonical)).isEqualTo(canonical);
    }
}
