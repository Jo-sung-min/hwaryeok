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

    @Column(name = "hydration_level", length = 20, nullable = false)
    private String hydrationLevel;

    @Column(name = "oiliness_level", length = 20, nullable = false)
    private String oilinessLevel;

    @Column(name = "sensitivity_level", length = 20, nullable = false)
    private String sensitivityLevel;

    @Column(name = "breakout_frequency", length = 20, nullable = false)
    private String breakoutFrequency;

    @Column(name = "profile_version", nullable = false)
    private int profileVersion;

    @Column(name = "cleansing_tightness", length = 20, nullable = false)
    private String cleansingTightness;

    @Column(name = "redness_frequency", length = 20, nullable = false)
    private String rednessFrequency;

    @Column(name = "pore_level", length = 20, nullable = false)
    private String poreLevel;

    @Column(name = "texture_preference", length = 20, nullable = false)
    private String texturePreference;

    @Column(name = "routine_complexity", length = 20, nullable = false)
    private String routineComplexity;

    @Column(name = "sunscreen_usage", length = 20, nullable = false)
    private String sunscreenUsage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserSkinProfile() {
    }

    public UserSkinProfile(String userId, String skinType, Instant createdAt, Instant updatedAt) {
        this.userId = userId;
        this.skinType = skinType;
        this.hydrationLevel = "BALANCED";
        this.oilinessLevel = "BALANCED";
        this.sensitivityLevel = "MEDIUM";
        this.breakoutFrequency = "OCCASIONAL";
        this.profileVersion = 1;
        this.cleansingTightness = "SHORT";
        this.rednessFrequency = "OCCASIONAL";
        this.poreLevel = "MEDIUM";
        this.texturePreference = "BALANCED";
        this.routineComplexity = "STANDARD";
        this.sunscreenUsage = "SOMETIMES";
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void update(
            String skinType,
            String hydrationLevel,
            String oilinessLevel,
            String sensitivityLevel,
            String breakoutFrequency,
            String cleansingTightness,
            String rednessFrequency,
            String poreLevel,
            String texturePreference,
            String routineComplexity,
            String sunscreenUsage,
            Instant updatedAt
    ) {
        this.skinType = skinType;
        this.hydrationLevel = hydrationLevel;
        this.oilinessLevel = oilinessLevel;
        this.sensitivityLevel = sensitivityLevel;
        this.breakoutFrequency = breakoutFrequency;
        this.profileVersion = 2;
        this.cleansingTightness = cleansingTightness;
        this.rednessFrequency = rednessFrequency;
        this.poreLevel = poreLevel;
        this.texturePreference = texturePreference;
        this.routineComplexity = routineComplexity;
        this.sunscreenUsage = sunscreenUsage;
        this.updatedAt = updatedAt;
    }

    public String getUserId() { return userId; }
    public String getSkinType() { return skinType; }
    public String getHydrationLevel() { return hydrationLevel; }
    public String getOilinessLevel() { return oilinessLevel; }
    public String getSensitivityLevel() { return sensitivityLevel; }
    public String getBreakoutFrequency() { return breakoutFrequency; }
    public int getProfileVersion() { return profileVersion; }
    public String getCleansingTightness() { return cleansingTightness; }
    public String getRednessFrequency() { return rednessFrequency; }
    public String getPoreLevel() { return poreLevel; }
    public String getTexturePreference() { return texturePreference; }
    public String getRoutineComplexity() { return routineComplexity; }
    public String getSunscreenUsage() { return sunscreenUsage; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
