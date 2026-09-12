package com.hwaryeok.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.hwaryeok.auth.token.TokenHashService;
import com.hwaryeok.common.config.DatabaseDialect;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

class LoginRateLimitServiceTest {

    @Test
    @SuppressWarnings("unchecked")
    void convertsInstantValuesBeforeBindingPostgresqlParameters() throws Exception {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        DatabaseDialect dialect = mock(DatabaseDialect.class);
        ResultSet resultSet = mock(ResultSet.class);
        List<Object[]> boundArguments = new ArrayList<>();

        when(dialect.isPostgresql()).thenReturn(true);
        when(resultSet.getInt("attempt_count")).thenReturn(0);
        when(resultSet.getTimestamp("window_started")).thenReturn(Timestamp.from(Instant.now().minusSeconds(1)));
        when(resultSet.getTimestamp("blocked_until")).thenReturn(null);
        when(jdbc.queryForObject(anyString(), any(RowMapper.class), any(Object[].class)))
                .thenAnswer(invocation -> ((RowMapper<?>) invocation.getArgument(1)).mapRow(resultSet, 0));
        when(jdbc.update(anyString(), any(Object[].class))).thenAnswer(invocation -> {
            Object[] invocationArguments = invocation.getArguments();
            boundArguments.add(Arrays.copyOfRange(invocationArguments, 1, invocationArguments.length));
            return 1;
        });

        var service = new LoginRateLimitService(jdbc, new TokenHashService(), dialect, 900, 900, 8, 100);
        service.registerFailure("missing@example.com", "127.0.0.1");

        List<Object> values = boundArguments.stream().flatMap(Arrays::stream).toList();
        assertThat(boundArguments).isNotEmpty();
        assertThat(values)
                .noneMatch(Instant.class::isInstance)
                .anyMatch(Timestamp.class::isInstance);
    }
}
