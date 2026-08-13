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
    private final String dummyPasswordHash;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthTokenService authTokenService,
            OAuthExchangeCodeService oauthExchangeCodeService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authTokenService = authTokenService;
        this.oauthExchangeCodeService = oauthExchangeCodeService;
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
                "USER",
                "ACTIVE",
                now,
                now
        );

        try {
            return SignupResponse.from(userRepository.saveAndFlush(user));
        } catch (DataIntegrityViolationException exception) {
            if (userRepository.existsByEmail(email)) throw new DuplicateEmailException();
            throw exception;
        }
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request) {
        String email = request.email().strip().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email).orElse(null);
        String passwordHash = user != null && user.getPasswordHash() != null
                ? user.getPasswordHash()
                : dummyPasswordHash;
        boolean passwordMatches = passwordEncoder.matches(request.password(), passwordHash);
        if (user == null || user.getPasswordHash() == null || !passwordMatches || !"ACTIVE".equals(user.getStatus())) {
            throw new InvalidCredentialsException();
        }
        return authTokenService.issue(user, "password");
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
