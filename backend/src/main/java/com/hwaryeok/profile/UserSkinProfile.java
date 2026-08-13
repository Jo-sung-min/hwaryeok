package com.hwaryeok.profile;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_skin_profiles")
public class UserSkinProfile {

    @Id
    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "skin_type", length = 20, nullable = false)
    private String skinType;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserSkinProfile() {
    }

    public UserSkinProfile(String userId, String skinType, Instant createdAt, Instant updatedAt) {
        this.userId = userId;
        this.skinType = skinType;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void update(String skinType, Instant updatedAt) {
        this.skinType = skinType;
        this.updatedAt = updatedAt;
    }

    public String getUserId() { return userId; }
    public String getSkinType() { return skinType; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
