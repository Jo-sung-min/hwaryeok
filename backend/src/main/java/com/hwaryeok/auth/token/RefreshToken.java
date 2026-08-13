package com.hwaryeok.auth.token;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @Column(length = 36, nullable = false)
    private String id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "token_hash", length = 64, nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "family_id", length = 36, nullable = false)
    private String familyId;

    @Column(name = "auth_method", length = 20, nullable = false)
    private String authMethod;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "replaced_by_token_id", length = 36)
    private String replacedByTokenId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected RefreshToken() {
    }

    public RefreshToken(String id, String userId, String tokenHash, String familyId, String authMethod,
                        Instant expiresAt, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.familyId = familyId;
        this.authMethod = authMethod;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    public void revoke(Instant revokedAt, String replacedByTokenId) {
        this.revokedAt = revokedAt;
        this.replacedByTokenId = replacedByTokenId;
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getTokenHash() { return tokenHash; }
    public String getFamilyId() { return familyId; }
    public String getAuthMethod() { return authMethod; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getRevokedAt() { return revokedAt; }
    public String getReplacedByTokenId() { return replacedByTokenId; }
    public Instant getCreatedAt() { return createdAt; }
}
