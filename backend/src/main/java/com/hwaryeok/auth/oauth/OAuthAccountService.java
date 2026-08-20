package com.hwaryeok.auth.oauth;

import java.time.Instant;
import java.util.UUID;

import com.hwaryeok.auth.AdminEmailPolicy;
import com.hwaryeok.user.User;
import com.hwaryeok.user.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OAuthAccountService {

    private final OAuthAccountRepository oauthAccountRepository;
    private final UserRepository userRepository;
    private final AdminEmailPolicy adminEmailPolicy;

    public OAuthAccountService(
            OAuthAccountRepository oauthAccountRepository,
            UserRepository userRepository,
            AdminEmailPolicy adminEmailPolicy
    ) {
        this.oauthAccountRepository = oauthAccountRepository;
        this.userRepository = userRepository;
        this.adminEmailPolicy = adminEmailPolicy;
    }

    @Transactional
    public OAuthLoginResult login(OAuthProfile profile) {
        String provider = profile.provider().name();
        OAuthAccount existingAccount = oauthAccountRepository
                .findByProviderAndProviderUserId(provider, profile.providerUserId())
                .orElse(null);

        if (existingAccount != null) {
            User user = userRepository.findById(existingAccount.getUserId())
                    .orElseThrow(() -> new OAuthLoginException("account_not_found", "연결된 화력 계정을 찾지 못했어요."));
            if (!"ACTIVE".equals(user.getStatus())) {
                throw new OAuthLoginException("account_unavailable", "현재 사용할 수 없는 계정이에요.");
            }
            return new OAuthLoginResult(user, profile.provider(), false);
        }

        if (userRepository.existsByEmail(profile.email())) {
            throw new OAuthLoginException(
                    "email_already_exists",
                    "같은 이메일의 화력 계정이 있어요. 기존 로그인 후 소셜 계정을 연결해주세요."
            );
        }

        Instant now = Instant.now();
        User user = new User(
                UUID.randomUUID().toString(),
                profile.email(),
                null,
                profile.nickname(),
                adminEmailPolicy.roleFor(profile.email()),
                "ACTIVE",
                now,
                now
        );
        try {
            userRepository.saveAndFlush(user);
            oauthAccountRepository.saveAndFlush(new OAuthAccount(
                    UUID.randomUUID().toString(),
                    user.getId(),
                    provider,
                    profile.providerUserId(),
                    profile.email(),
                    now,
                    now
            ));
        } catch (DataIntegrityViolationException exception) {
            throw new OAuthLoginException(
                    "concurrent_login",
                    "동시에 처리된 소셜 로그인이 있어요. 다시 한 번 로그인해 주세요."
            );
        }
        return new OAuthLoginResult(user, profile.provider(), true);
    }
}
