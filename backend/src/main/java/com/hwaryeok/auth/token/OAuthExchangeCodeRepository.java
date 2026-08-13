package com.hwaryeok.auth.token;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OAuthExchangeCodeRepository extends JpaRepository<OAuthExchangeCode, String> {
}
