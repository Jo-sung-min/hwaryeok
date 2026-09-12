package db.migration;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.text.Normalizer;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

public class V44__add_unique_activity_nicknames_and_profile_images extends BaseJavaMigration {

    private static final int MAX_NICKNAME_CODE_POINTS = 20;

    @Override
    public void migrate(Context context) throws Exception {
        try (Statement statement = context.getConnection().createStatement()) {
            statement.execute("ALTER TABLE users ADD COLUMN nickname_key VARCHAR(80)");
            statement.execute("ALTER TABLE reviewer_profiles ADD COLUMN profile_image_url VARCHAR(2048)");
        }

        Set<String> usedKeys = new HashSet<>();
        try (PreparedStatement select = context.getConnection().prepareStatement(
                "SELECT id, nickname FROM users ORDER BY created_at, id");
             ResultSet rows = select.executeQuery();
             PreparedStatement update = context.getConnection().prepareStatement(
                     "UPDATE users SET nickname = ?, nickname_key = ? WHERE id = ?")) {
            while (rows.next()) {
                String base = normalizeDisplayName(rows.getString("nickname"));
                String candidate = uniqueCandidate(base, usedKeys);
                String key = normalizedKey(candidate);
                usedKeys.add(key);
                update.setString(1, candidate);
                update.setString(2, key);
                update.setString(3, rows.getString("id"));
                update.addBatch();
            }
            update.executeBatch();
        }

        try (Statement statement = context.getConnection().createStatement()) {
            statement.execute("ALTER TABLE users ALTER COLUMN nickname_key SET NOT NULL");
            statement.execute("CREATE UNIQUE INDEX ux_users_nickname_key ON users (nickname_key)");
        }
    }

    private static String uniqueCandidate(String base, Set<String> usedKeys) {
        if (!usedKeys.contains(normalizedKey(base))) return base;
        for (int number = 2; ; number++) {
            String suffix = " ·" + number;
            String candidate = truncate(base, MAX_NICKNAME_CODE_POINTS - suffix.codePointCount(0, suffix.length())) + suffix;
            if (!usedKeys.contains(normalizedKey(candidate))) return candidate;
        }
    }

    private static String normalizeDisplayName(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFKC)
                .strip().replaceAll("\\s+", " ");
        if (normalized.codePointCount(0, normalized.length()) < 2
                || normalized.codePoints().anyMatch(V44__add_unique_activity_nicknames_and_profile_images::isUnsafe)) {
            normalized = "화력 회원";
        }
        return truncate(normalized, MAX_NICKNAME_CODE_POINTS);
    }

    private static boolean isUnsafe(int codePoint) {
        return Character.isISOControl(codePoint) || Character.getType(codePoint) == Character.FORMAT;
    }

    private static String normalizedKey(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT);
    }

    private static String truncate(String value, int maxCodePoints) {
        int count = value.codePointCount(0, value.length());
        return count <= maxCodePoints ? value : value.substring(0, value.offsetByCodePoints(0, maxCodePoints));
    }
}
