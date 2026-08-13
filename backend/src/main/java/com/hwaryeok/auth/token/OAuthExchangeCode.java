package com.hwaryeok.auth.token;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "oauth_exchange_codes")
public class OAuthExchangeCode {

    @Id
    @Column(name = "code_hash", length = 64, nullable = false)
    private String codeHash;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(length = 20, nullable = false)
    private String provider;

    @Column(name = "new_user", nullable = false)
    private boolean newUser;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected OAuthExchangeCode() {
    }

    public OAuthExchangeCode(String codeHash, String userId, String provider, boolean newUser,
                             Instant expiresAt, Instant createdAt) {
        this.codeHash = codeHash;
        this.userId = userId;
        this.provider = provider;
        this.newUser = newUser;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    public void markUsed(Instant usedAt) {
        this.usedAt = usedAt;
    }

    public String getCodeHash() { return codeHash; }
    public String getUserId() { return userId; }
    public String getProvider() { return provider; }
    public boolean isNewUser() { return newUser; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getUsedAt() { return usedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
