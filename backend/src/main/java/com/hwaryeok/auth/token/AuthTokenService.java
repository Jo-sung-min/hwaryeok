package com.hwaryeok.auth.token;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import com.hwaryeok.auth.AuthTokenResponse;
import com.hwaryeok.auth.AuthUserResponse;
import com.hwaryeok.auth.InvalidRefreshTokenException;
import com.hwaryeok.user.User;
import com.hwaryeok.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthTokenService {

    private final JwtEncoder jwtEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final TokenHashService tokenHashService;
    private final String issuer;
    private final Duration accessTokenTtl;
    private final Duration refreshTokenTtl;

    public AuthTokenService(
            JwtEncoder jwtEncoder,
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository,
            TokenHashService tokenHashService,
            @Value("${app.auth.jwt-issuer}") String issuer,
            @Value("${app.auth.access-token-seconds}") long accessTokenSeconds,
            @Value("${app.auth.refresh-token-seconds}") long refreshTokenSeconds
    ) {
        this.jwtEncoder = jwtEncoder;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.tokenHashService = tokenHashService;
        this.issuer = issuer;
        this.accessTokenTtl = Duration.ofSeconds(accessTokenSeconds);
        this.refreshTokenTtl = Duration.ofSeconds(refreshTokenSeconds);
    }

    @Transactional
    public AuthTokenResponse issue(User user, String authMethod) {
        return issue(user, authMethod, UUID.randomUUID().toString(), Instant.now());
    }

    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public AuthTokenResponse rotate(String rawRefreshToken) {
        Instant now = Instant.now();
        RefreshToken current = refreshTokenRepository.findByTokenHashForUpdate(tokenHashService.hash(rawRefreshToken))
                .orElseThrow(InvalidRefreshTokenException::new);

        if (current.getRevokedAt() != null || !current.getExpiresAt().isAfter(now)) {
            refreshTokenRepository.revokeFamily(current.getFamilyId(), now);
            throw new InvalidRefreshTokenException();
        }

        User user = activeUser(current.getUserId());
        String rawNextToken = tokenHashService.createOpaqueToken();
        String nextTokenId = UUID.randomUUID().toString();
        RefreshToken next = new RefreshToken(
                nextTokenId,
                user.getId(),
                tokenHashService.hash(rawNextToken),
                current.getFamilyId(),
                current.getAuthMethod(),
                now.plus(refreshTokenTtl),
                now
        );
        current.revoke(now, nextTokenId);
        refreshTokenRepository.save(next);
        return response(user, current.getAuthMethod(), rawNextToken, now);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokenRepository.findByTokenHash(tokenHashService.hash(rawRefreshToken))
                .ifPresent(token -> refreshTokenRepository.revokeFamily(token.getFamilyId(), Instant.now()));
    }

    private AuthTokenResponse issue(User user, String authMethod, String familyId, Instant now) {
        String rawRefreshToken = tokenHashService.createOpaqueToken();
        RefreshToken refreshToken = new RefreshToken(
                UUID.randomUUID().toString(),
                user.getId(),
                tokenHashService.hash(rawRefreshToken),
                familyId,
                authMethod,
                now.plus(refreshTokenTtl),
                now
        );
        refreshTokenRepository.save(refreshToken);
        return response(user, authMethod, rawRefreshToken, now);
    }

    private AuthTokenResponse response(User user, String authMethod, String rawRefreshToken, Instant now) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(now)
                .expiresAt(now.plus(accessTokenTtl))
                .subject(user.getId())
                .id(UUID.randomUUID().toString())
                .claim("role", user.getRole())
                .claim("auth_method", authMethod)
                .claim("token_type", "access")
                .build();
        String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
        return new AuthTokenResponse(
                accessToken,
                rawRefreshToken,
                "Bearer",
                accessTokenTtl.toSeconds(),
                refreshTokenTtl.toSeconds(),
                AuthUserResponse.from(user, authMethod)
        );
    }

    private User activeUser(String userId) {
        User user = userRepository.findById(userId).orElseThrow(InvalidRefreshTokenException::new);
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new InvalidRefreshTokenException();
        }
        return user;
    }
}
