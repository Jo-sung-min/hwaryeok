package com.hwaryeok.auth;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminEmailPolicy {

    private final Set<String> adminEmails;

    public AdminEmailPolicy(@Value("${app.auth.admin-emails:}") String configuredEmails) {
        this.adminEmails = Arrays.stream(configuredEmails.split(","))
                .map(String::strip)
                .filter(email -> !email.isBlank())
                .map(email -> email.toLowerCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
    }

    public boolean isAdmin(String email) {
        return email != null && adminEmails.contains(email.strip().toLowerCase(Locale.ROOT));
    }

    public String roleFor(String email) {
        return isAdmin(email) ? "ADMIN" : "USER";
    }
}
