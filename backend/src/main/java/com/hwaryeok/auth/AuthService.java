package com.hwaryeok.auth;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import com.hwaryeok.auth.token.AuthTokenService;
import com.hwaryeok.auth.token.OAuthExchangeCodeService;
import com.hwaryeok.user.User;
import com.hwaryeok.user.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthTokenService authTokenService;
    private final OAuthExchangeCodeService oauthExchangeCodeService;
    private final LoginRateLimitService loginRateLimitService;
    private final AdminEmailPolicy adminEmailPolicy;
    private final String dummyPasswordHash;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthTokenService authTokenService,
            OAuthExchangeCodeService oauthExchangeCodeService,
            LoginRateLimitService loginRateLimitService,
            AdminEmailPolicy adminEmailPolicy
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authTokenService = authTokenService;
        this.oauthExchangeCodeService = oauthExchangeCodeService;
        this.loginRateLimitService = loginRateLimitService;
        this.adminEmailPolicy = adminEmailPolicy;
        this.dummyPasswordHash = passwordEncoder.encode("invalid-password-value");
    }

    @Transactional
    public SignupResponse signup(SignupRequest request) {
        String email = request.email().strip().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) throw new DuplicateEmailException();

        Instant now = Instant.now();
        User user = new User(
                UUID.randomUUID().toString(),
                email,
                passwordEncoder.encode(request.password()),
                request.nickname().strip(),
                adminEmailPolicy.roleFor(email),
                "ACTIVE",
                now,
                now
        );

        try {
            return SignupResponse.from(userRepository.saveAndFlush(user));
        } catch (DataIntegrityViolationException exception) {
            // PostgreSQL은 무결성 위반 뒤 같은 트랜잭션의 추가 쿼리를 거부하므로 바로 충돌로 변환합니다.
            throw new DuplicateEmailException();
        }
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request, String clientAddress) {
        String email = request.email().strip().toLowerCase(Locale.ROOT);
        loginRateLimitService.checkAllowed(email, clientAddress);
        User user = userRepository.findByEmail(email).orElse(null);
        String passwordHash = user != null && user.getPasswordHash() != null
                ? user.getPasswordHash()
                : dummyPasswordHash;
        boolean passwordMatches = passwordEncoder.matches(request.password(), passwordHash);
        if (user == null || user.getPasswordHash() == null || !passwordMatches || !"ACTIVE".equals(user.getStatus())) {
            loginRateLimitService.registerFailure(email, clientAddress);
            throw new InvalidCredentialsException();
        }
        AuthTokenResponse response = authTokenService.issue(user, "password");
        loginRateLimitService.clearSuccessfulIdentity(email);
        return response;
    }

    public AuthTokenResponse refresh(TokenRefreshRequest request) {
        return authTokenService.rotate(request.refreshToken());
    }

    public LogoutResponse logout(LogoutRequest request) {
        authTokenService.logout(request.refreshToken());
        return new LogoutResponse(true);
    }

    public AuthTokenResponse exchangeOAuthCode(OAuthExchangeRequest request) {
        return oauthExchangeCodeService.exchange(request.code());
    }

    @Transactional(readOnly = true)
    public AuthUserResponse currentUser(String userId, String authMethod) {
        User user = userRepository.findById(userId)
                .filter(candidate -> "ACTIVE".equals(candidate.getStatus()))
                .orElseThrow(InvalidCredentialsException::new);
        return AuthUserResponse.from(user, authMethod);
    }
}
