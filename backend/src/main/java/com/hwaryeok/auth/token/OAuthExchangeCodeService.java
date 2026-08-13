package com.hwaryeok.auth.token;

import java.time.Duration;
import java.time.Instant;

import com.hwaryeok.auth.AuthTokenResponse;
import com.hwaryeok.auth.InvalidOAuthExchangeCodeException;
import com.hwaryeok.auth.oauth.OAuthProvider;
import com.hwaryeok.user.User;
import com.hwaryeok.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OAuthExchangeCodeService {

    private final OAuthExchangeCodeRepository codeRepository;
    private final UserRepository userRepository;
    private final TokenHashService tokenHashService;
    private final AuthTokenService authTokenService;
    private final Duration codeTtl;

    public OAuthExchangeCodeService(
            OAuthExchangeCodeRepository codeRepository,
            UserRepository userRepository,
            TokenHashService tokenHashService,
            AuthTokenService authTokenService,
            @Value("${app.auth.oauth-exchange-code-seconds}") long codeTtlSeconds
    ) {
        this.codeRepository = codeRepository;
        this.userRepository = userRepository;
        this.tokenHashService = tokenHashService;
        this.authTokenService = authTokenService;
        this.codeTtl = Duration.ofSeconds(codeTtlSeconds);
    }

    @Transactional
    public String issue(String userId, OAuthProvider provider, boolean newUser) {
        String rawCode = tokenHashService.createOpaqueToken();
        Instant now = Instant.now();
        codeRepository.save(new OAuthExchangeCode(
                tokenHashService.hash(rawCode),
                userId,
                provider.name(),
                newUser,
                now.plus(codeTtl),
                now
        ));
        return rawCode;
    }

    @Transactional
    public AuthTokenResponse exchange(String rawCode) {
        Instant now = Instant.now();
        OAuthExchangeCode code = codeRepository.findById(tokenHashService.hash(rawCode))
                .orElseThrow(InvalidOAuthExchangeCodeException::new);
        if (code.getUsedAt() != null || !code.getExpiresAt().isAfter(now)) {
            throw new InvalidOAuthExchangeCodeException();
        }
        code.markUsed(now);
        User user = userRepository.findById(code.getUserId())
                .filter(candidate -> "ACTIVE".equals(candidate.getStatus()))
                .orElseThrow(InvalidOAuthExchangeCodeException::new);
        return authTokenService.issue(user, code.getProvider().toLowerCase());
    }
}
