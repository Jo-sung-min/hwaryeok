package com.hwaryeok.review;

import static com.hwaryeok.review.ReviewerProfileDtos.*;

import java.net.URI;
import java.net.URISyntaxException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

import com.hwaryeok.user.ActiveUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
@Transactional(readOnly = true)
public class ReviewerProfileService {

    private static final Logger log = LoggerFactory.getLogger(ReviewerProfileService.class);
    private static final int MAX_DOCUMENT_CHARACTERS = 50_000;
    private static final int MAX_DOCUMENT_NODES = 4_000;
    private static final int MAX_DOCUMENT_DEPTH = 20;
    private static final int MAX_TOP_LEVEL_BLOCKS = 200;
    private static final Set<String> INSTAGRAM_HOSTS = Set.of(
            "instagram.com",
            "www.instagram.com",
            "m.instagram.com"
    );
    private static final Set<String> TEXT_BLOCK_TYPES = Set.of(
            "paragraph",
            "heading",
            "bulletListItem",
            "numberedListItem",
            "checkListItem",
            "quote",
            "codeBlock",
            "toggleListItem"
    );
    private static final Set<String> ALLOWED_BLOCK_TYPES = Set.of(
            "paragraph",
            "heading",
            "bulletListItem",
            "numberedListItem",
            "checkListItem",
            "quote",
            "codeBlock",
            "divider",
            "toggleListItem"
    );
    private static final Set<String> BLOCK_FIELDS = Set.of("id", "type", "props", "content", "children");
    private static final Set<String> TEXT_FIELDS = Set.of("type", "text", "styles");
    private static final Set<String> STYLE_FIELDS = Set.of(
            "bold", "italic", "underline", "strike", "code", "textColor", "backgroundColor"
    );
    private static final Set<String> COLORS = Set.of(
            "default", "gray", "brown", "red", "orange", "yellow", "green", "blue", "purple", "pink"
    );
    private static final Pattern SAFE_CSS_COLOR = Pattern.compile(
            "^(?:#[0-9a-fA-F]{3,4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|(?:rgb|rgba|hsl|hsla)\\([0-9\\s,.%+\\-]+\\))$",
            Pattern.CASE_INSENSITIVE
    );
    private static final Set<String> ALIGNMENTS = Set.of("left", "center", "right", "justify");

    private final JdbcTemplate jdbc;
    private final ActiveUserService activeUserService;
    private final ObjectMapper objectMapper;

    public ReviewerProfileService(
            JdbcTemplate jdbc,
            ActiveUserService activeUserService,
            ObjectMapper objectMapper
    ) {
        this.jdbc = jdbc;
        this.activeUserService = activeUserService;
        this.objectMapper = objectMapper;
    }

    public EditorResponse mine(String userId) {
        activeUserService.requireActive(userId);
        return jdbc.query("""
                SELECT u.id, u.nickname, p.introduction_json, p.blog_url, p.instagram_url, p.updated_at
                FROM users u LEFT JOIN reviewer_profiles p ON p.user_id = u.id
                WHERE u.id = ? AND u.status = 'ACTIVE'
                """, (rs, rowNum) -> editor(rs), userId).stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("활동 중인 회원 프로필을 조회하지 못했어요."));
    }

    @Transactional
    public EditorResponse save(String userId, UpdateRequest request) {
        // The profile row does not exist on the first save, so serialize every upsert on its stable parent user row.
        // A second transaction observes the committed insert before it reaches the UPDATE/INSERT branch.
        activeUserService.requireActiveForUpdate(userId);
        if (request == null) throw new IllegalArgumentException("소개 정보를 입력해 주세요.");

        String introduction = normalizeBioBlocks(request.bioBlocks());
        String blogUrl = normalizeExternalUrl(request.blogUrl(), "블로그", null);
        String instagramUrl = normalizeExternalUrl(request.instagramUrl(), "Instagram", INSTAGRAM_HOSTS);
        Instant now = Instant.now();
        int updated = jdbc.update("""
                UPDATE reviewer_profiles
                SET introduction_json = ?, blog_url = ?, instagram_url = ?, updated_at = ?
                WHERE user_id = ?
                """, introduction, blogUrl, instagramUrl, Timestamp.from(now), userId);
        if (updated == 0) {
            jdbc.update("""
                    INSERT INTO reviewer_profiles
                        (user_id, introduction_json, blog_url, instagram_url, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, userId, introduction, blogUrl, instagramUrl, Timestamp.from(now), Timestamp.from(now));
        }
        return mine(userId);
    }

    public PublicResponse publicProfile(ReviewerProfileResponse stats) {
        return PublicResponse.from(stats, presentation(stats.userId()));
    }

    private Presentation presentation(String userId) {
        return jdbc.query("""
                SELECT introduction_json, blog_url, instagram_url, updated_at
                FROM reviewer_profiles WHERE user_id = ?
                """, (rs, rowNum) -> presentation(rs, userId), userId).stream().findFirst()
                .orElseGet(() -> new Presentation(emptyDocument(), null, null, null));
    }

    private EditorResponse editor(ResultSet rs) throws SQLException {
        String stored = rs.getString("introduction_json");
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        return new EditorResponse(
                rs.getString("id"),
                rs.getString("nickname"),
                parseBioBlocks(stored, rs.getString("id")),
                rs.getString("blog_url"),
                rs.getString("instagram_url"),
                updatedAt == null ? null : updatedAt.toInstant()
        );
    }

    private Presentation presentation(ResultSet rs, String userId) throws SQLException {
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        return new Presentation(
                parseBioBlocks(rs.getString("introduction_json"), userId),
                rs.getString("blog_url"),
                rs.getString("instagram_url"),
                updatedAt == null ? null : updatedAt.toInstant()
        );
    }

    private String normalizeBioBlocks(JsonNode bioBlocks) {
        validateBioBlocks(bioBlocks);
        return bioBlocks.toString();
    }

    private void validateBioBlocks(JsonNode bioBlocks) {
        if (bioBlocks == null || !bioBlocks.isArray()) {
            throw new IllegalArgumentException("소개 내용은 BlockNote 블록 배열이어야 해요.");
        }
        if (bioBlocks.size() > MAX_TOP_LEVEL_BLOCKS) {
            throw new IllegalArgumentException("소개는 최대 200개 블록까지 작성할 수 있어요.");
        }
        validateTree(bioBlocks, 0, new Counter());
        Set<String> ids = new HashSet<>();
        for (JsonNode block : bioBlocks) validateBlock(block, ids);
        String serialized = bioBlocks.toString();
        if (serialized.length() > MAX_DOCUMENT_CHARACTERS) {
            throw new IllegalArgumentException("소개 내용은 50,000자 이내로 작성해 주세요.");
        }
    }

    private void validateBlock(JsonNode block, Set<String> ids) {
        if (block == null || !block.isObject()) {
            throw new IllegalArgumentException("소개 내용의 각 블록 형식을 다시 확인해 주세요.");
        }
        requireOnlyFields(block, BLOCK_FIELDS, "소개 블록");

        String type = requiredTextValue(block.get("type"), 40, "소개 블록 타입");
        if (!ALLOWED_BLOCK_TYPES.contains(type)) {
            throw new IllegalArgumentException("소개에는 텍스트 블록만 사용할 수 있어요.");
        }

        JsonNode id = block.get("id");
        if (id != null) {
            String value = requiredTextValue(id, 128, "소개 블록 ID");
            if (!ids.add(value)) throw new IllegalArgumentException("소개 블록 ID가 중복되었어요.");
        }

        validateProps(type, block.get("props"));
        validateBlockContent(type, block.get("content"));

        JsonNode children = block.get("children");
        if (children != null) {
            if (!children.isArray()) throw new IllegalArgumentException("소개 블록의 하위 내용 형식을 다시 확인해 주세요.");
            for (JsonNode child : children) validateBlock(child, ids);
        }
    }

    private void validateProps(String type, JsonNode props) {
        if (props == null) return;
        if (!props.isObject()) throw new IllegalArgumentException("소개 블록 속성 형식을 다시 확인해 주세요.");

        Set<String> allowed = switch (type) {
            case "heading" -> Set.of("backgroundColor", "textColor", "textAlignment", "level", "isToggleable");
            case "checkListItem" -> Set.of("backgroundColor", "textColor", "textAlignment", "checked");
            case "numberedListItem" -> Set.of("backgroundColor", "textColor", "textAlignment", "start");
            case "paragraph", "bulletListItem", "toggleListItem" ->
                    Set.of("backgroundColor", "textColor", "textAlignment");
            case "quote" -> Set.of("backgroundColor", "textColor");
            case "codeBlock" -> Set.of("language");
            case "divider" -> Set.of();
            default -> throw new IllegalArgumentException("지원하지 않는 소개 블록이에요.");
        };
        requireOnlyFields(props, allowed, "소개 블록 속성");

        validateColor(props.get("backgroundColor"), "배경색");
        validateColor(props.get("textColor"), "글자색");
        JsonNode alignment = props.get("textAlignment");
        if (alignment != null && (!alignment.isString() || !ALIGNMENTS.contains(alignment.asString()))) {
            throw new IllegalArgumentException("소개 블록의 정렬 값을 다시 확인해 주세요.");
        }
        validateInteger(props.get("level"), 1, 6, "제목 단계");
        validateInteger(props.get("start"), 1, 1_000_000, "번호 목록 시작값");
        JsonNode checked = props.get("checked");
        if (checked != null && !checked.isBoolean()) {
            throw new IllegalArgumentException("체크 목록 상태를 다시 확인해 주세요.");
        }
        JsonNode toggleable = props.get("isToggleable");
        if (toggleable != null && !toggleable.isBoolean()) {
            throw new IllegalArgumentException("접기 가능한 제목 상태를 다시 확인해 주세요.");
        }
        JsonNode language = props.get("language");
        if (language != null) optionalTextValue(language, 80, "코드 언어");
    }

    private void validateBlockContent(String type, JsonNode content) {
        if ("divider".equals(type)) {
            if (content != null) throw new IllegalArgumentException("구분선 블록에는 텍스트를 넣을 수 없어요.");
            return;
        }
        if (!TEXT_BLOCK_TYPES.contains(type)) {
            throw new IllegalArgumentException("소개에는 텍스트 블록만 사용할 수 있어요.");
        }
        if (content == null) return;
        if (content.isString()) {
            requireSafeString(content.asString(), "소개 텍스트");
            return;
        }
        if (!content.isArray()) throw new IllegalArgumentException("소개 블록의 텍스트 형식을 다시 확인해 주세요.");
        boolean codeBlock = "codeBlock".equals(type);
        for (JsonNode inline : content) validateInlineContent(inline, codeBlock);
    }

    private void validateInlineContent(JsonNode inline, boolean codeBlock) {
        if (inline != null && inline.isString()) {
            requireSafeString(inline.asString(), "소개 텍스트");
            return;
        }
        if (inline == null || !inline.isObject()) {
            throw new IllegalArgumentException("소개 인라인 텍스트 형식을 다시 확인해 주세요.");
        }
        String type = requiredTextValue(inline.get("type"), 20, "소개 인라인 타입");
        if ("text".equals(type)) {
            validateStyledText(inline);
            if (codeBlock) {
                JsonNode styles = inline.get("styles");
                if (styles != null && styles.size() != 0) {
                    throw new IllegalArgumentException("코드 블록에는 글자 스타일을 사용할 수 없어요.");
                }
            }
            return;
        }
        throw new IllegalArgumentException("소개 본문에는 링크를 넣을 수 없어요. 블로그나 Instagram 연결란을 이용해 주세요.");
    }

    private void validateStyledText(JsonNode text) {
        requireOnlyFields(text, TEXT_FIELDS, "소개 텍스트");
        optionalTextValue(text.get("text"), MAX_DOCUMENT_CHARACTERS, "소개 텍스트");
        validateStyles(text.get("styles"));
    }

    private void validateStyles(JsonNode styles) {
        if (styles == null) return;
        if (!styles.isObject()) throw new IllegalArgumentException("소개 글자 스타일 형식을 다시 확인해 주세요.");
        requireOnlyFields(styles, STYLE_FIELDS, "소개 글자 스타일");
        for (String name : Set.of("bold", "italic", "underline", "strike", "code")) {
            JsonNode value = styles.get(name);
            if (value != null && !value.isBoolean()) {
                throw new IllegalArgumentException("소개 글자 스타일 값을 다시 확인해 주세요.");
            }
        }
        validateColor(styles.get("textColor"), "글자색");
        validateColor(styles.get("backgroundColor"), "배경색");
    }

    private void validateColor(JsonNode value, String label) {
        if (value == null) return;
        if (!value.isString() || value.asString().length() > 80
                || !(COLORS.contains(value.asString()) || SAFE_CSS_COLOR.matcher(value.asString()).matches())) {
            throw new IllegalArgumentException("소개 " + label + " 값을 다시 확인해 주세요.");
        }
    }

    private void validateInteger(JsonNode value, int min, int max, String label) {
        if (value != null && (!value.isIntegralNumber() || value.longValue() < min || value.longValue() > max)) {
            throw new IllegalArgumentException(label + "을(를) 다시 확인해 주세요.");
        }
    }

    private String requiredTextValue(JsonNode value, int max, String label) {
        if (value == null || !value.isString() || value.asString().isBlank() || value.asString().length() > max) {
            throw new IllegalArgumentException(label + " 형식을 다시 확인해 주세요.");
        }
        requireSafeString(value.asString(), label);
        return value.asString();
    }

    private String optionalTextValue(JsonNode value, int max, String label) {
        if (value == null || !value.isString() || value.asString().length() > max) {
            throw new IllegalArgumentException(label + " 형식을 다시 확인해 주세요.");
        }
        requireSafeString(value.asString(), label);
        return value.asString();
    }

    private void requireSafeString(String value, String label) {
        if (value.indexOf('\u0000') >= 0) throw new IllegalArgumentException(label + "에 사용할 수 없는 문자가 있어요.");
    }

    private void requireOnlyFields(JsonNode object, Set<String> allowed, String label) {
        for (var property : object.properties()) {
            if (!allowed.contains(property.getKey())) {
                throw new IllegalArgumentException(label + "에 지원하지 않는 항목이 있어요.");
            }
        }
    }

    private void validateTree(JsonNode node, int depth, Counter counter) {
        if (depth > MAX_DOCUMENT_DEPTH) {
            throw new IllegalArgumentException("소개 내용의 중첩 구조가 너무 깊어요.");
        }
        counter.value++;
        if (counter.value > MAX_DOCUMENT_NODES) {
            throw new IllegalArgumentException("소개 내용이 너무 복잡해요. 블록 수를 줄여 주세요.");
        }
        if (node.isArray() || node.isObject()) {
            for (JsonNode child : node) validateTree(child, depth + 1, counter);
        }
    }

    private String normalizeExternalUrl(String raw, String label, Set<String> allowedHosts) {
        if (raw == null || raw.isBlank()) return null;
        String value = raw.trim();
        if (value.length() > 2048 || value.indexOf('\u0000') >= 0) {
            throw new IllegalArgumentException(label + " 주소는 2,048자 이내로 입력해 주세요.");
        }
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
            if (!("http".equals(scheme) || "https".equals(scheme)) || host.isBlank()
                    || uri.getRawUserInfo() != null) {
                throw new IllegalArgumentException(label + " 주소는 http 또는 https로 시작하는 웹 주소여야 해요.");
            }
            if (allowedHosts != null && !allowedHosts.contains(host)) {
                throw new IllegalArgumentException("Instagram 주소는 instagram.com 링크만 사용할 수 있어요.");
            }
            return value;
        } catch (URISyntaxException exception) {
            throw new IllegalArgumentException(label + " 주소 형식을 다시 확인해 주세요.");
        }
    }

    private JsonNode parseBioBlocks(String stored, String userId) {
        if (stored == null || stored.isBlank()) return emptyDocument();
        try {
            JsonNode document = objectMapper.readTree(stored);
            validateBioBlocks(document);
            return document;
        } catch (Exception exception) {
            log.warn("Ignoring invalid reviewer profile bioBlocks for user {}: {}", userId, exception.getMessage());
            return emptyDocument();
        }
    }

    private JsonNode emptyDocument() {
        return objectMapper.createArrayNode();
    }

    private static final class Counter {
        private int value;
    }
}
