package com.hwaryeok.common.config;

import java.sql.SQLException;

import javax.sql.DataSource;

import org.springframework.stereotype.Component;

@Component
public class DatabaseDialect {

    private final boolean postgresql;

    public DatabaseDialect(DataSource dataSource) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            this.postgresql = "PostgreSQL".equalsIgnoreCase(connection.getMetaData().getDatabaseProductName());
        }
    }

    public boolean isPostgresql() {
        return postgresql;
    }
}
