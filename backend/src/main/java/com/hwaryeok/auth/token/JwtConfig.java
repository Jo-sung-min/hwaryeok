package com.hwaryeok.auth.token;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration
public class JwtConfig {

    private final SecretKey secretKey;
    private final String issuer;

    public JwtConfig(
            @Value("${app.auth.jwt-secret}") String jwtSecret,
            @Value("${app.auth.jwt-issuer}") String issuer,
            @Value("${spring.profiles.active:}") String activeProfiles
    ) {
        byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        boolean localProfile = activeProfiles.lines()
                .flatMap(value -> java.util.Arrays.stream(value.split(",")))
                .map(String::trim)
                .anyMatch("local"::equalsIgnoreCase);
        if (secretBytes.length < 32
                || jwtSecret.startsWith("replace-with-")
                || (!localProfile && jwtSecret.startsWith("local-development-"))) {
            throw new IllegalStateException("JWT_SECRET must be a non-default secret of at least 32 bytes");
        }
        this.secretKey = new SecretKeySpec(secretBytes, "HmacSHA256");
        this.issuer = issuer;
    }

    @Bean
    JwtEncoder jwtEncoder() {
        return NimbusJwtEncoder.withSecretKey(secretKey)
                .algorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    JwtDecoder jwtDecoder() {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuer));
        return decoder;
    }
}
