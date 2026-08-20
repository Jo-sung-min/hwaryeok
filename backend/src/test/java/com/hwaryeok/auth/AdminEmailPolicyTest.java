package com.hwaryeok.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AdminEmailPolicyTest {

    @Test
    void matchesConfiguredAdminEmailIgnoringCaseAndWhitespace() {
        AdminEmailPolicy policy = new AdminEmailPolicy("wings2530@gmail.com, second@example.com");

        assertThat(policy.roleFor(" WINGS2530@gmail.com ")).isEqualTo("ADMIN");
        assertThat(policy.roleFor("user@example.com")).isEqualTo("USER");
    }
}
