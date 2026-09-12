package db.migration;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/**
 * V6 used an unnamed check constraint. PostgreSQL and H2 assign different generated names,
 * so discover the concern constraint before replacing it with the expanded questionnaire values.
 */
public class V41__expand_user_skin_concern_values extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws Exception {
        Connection connection = context.getConnection();
        for (String constraint : concernCheckConstraints(connection)) {
            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE user_skin_concerns DROP CONSTRAINT " + quote(constraint));
            }
        }
        try (Statement statement = connection.createStatement()) {
            statement.execute("""
                    ALTER TABLE user_skin_concerns
                    ADD CONSTRAINT chk_user_skin_concerns_concern CHECK (concern IN (
                        '속건조', '민감', '모공', '붉은기', '피부 장벽', '각질', '칙칙함', '탄력',
                        '속건조·당김', '유분·번들거림', '트러블·여드름', '블랙헤드·모공',
                        '붉은기·민감', '장벽·각질', '잡티·칙칙함', '탄력·잔주름'
                    ))
                    """);
        }
    }

    private List<String> concernCheckConstraints(Connection connection) throws Exception {
        String product = connection.getMetaData().getDatabaseProductName().toLowerCase(Locale.ROOT);
        if (product.contains("postgresql")) return postgresConstraints(connection);
        if (product.contains("h2")) return h2Constraints(connection);
        throw new IllegalStateException("지원하지 않는 데이터베이스에서 피부 고민 제약 조건을 변경할 수 없어요: " + product);
    }

    private List<String> postgresConstraints(Connection connection) throws Exception {
        String sql = """
                SELECT constraint_row.conname, pg_get_constraintdef(constraint_row.oid)
                FROM pg_constraint constraint_row
                WHERE constraint_row.conrelid = 'user_skin_concerns'::regclass
                  AND constraint_row.contype = 'c'
                """;
        return matchingConstraints(connection, sql);
    }

    private List<String> h2Constraints(Connection connection) throws Exception {
        String sql = """
                SELECT table_constraint.constraint_name, check_constraint.check_clause
                FROM information_schema.table_constraints table_constraint
                JOIN information_schema.check_constraints check_constraint
                  ON check_constraint.constraint_catalog = table_constraint.constraint_catalog
                 AND check_constraint.constraint_schema = table_constraint.constraint_schema
                 AND check_constraint.constraint_name = table_constraint.constraint_name
                WHERE LOWER(table_constraint.table_name) = 'user_skin_concerns'
                  AND table_constraint.constraint_type = 'CHECK'
                """;
        return matchingConstraints(connection, sql);
    }

    private List<String> matchingConstraints(Connection connection, String sql) throws Exception {
        List<String> constraints = new ArrayList<>();
        try (PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet result = statement.executeQuery()) {
            while (result.next()) {
                String definition = result.getString(2);
                if (definition != null && definition.toLowerCase(Locale.ROOT).contains("concern")) {
                    constraints.add(result.getString(1));
                }
            }
        }
        return constraints;
    }

    private String quote(String identifier) {
        return '"' + identifier.replace("\"", "\"\"") + '"';
    }
}
