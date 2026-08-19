package com.hwaryeok.auth.token;

import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OAuthExchangeCodeRepository extends JpaRepository<OAuthExchangeCode, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select code from OAuthExchangeCode code where code.codeHash = :codeHash")
    Optional<OAuthExchangeCode> findByCodeHashForUpdate(@Param("codeHash") String codeHash);
}
