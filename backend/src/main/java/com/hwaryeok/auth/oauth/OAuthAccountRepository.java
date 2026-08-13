package com.hwaryeok.auth.oauth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, String> {
    Optional<OAuthAccount> findByProviderAndProviderUserId(String provider, String providerUserId);
}
