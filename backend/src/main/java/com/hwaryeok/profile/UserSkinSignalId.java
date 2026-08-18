package com.hwaryeok.profile;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class UserSkinSignalId implements Serializable {

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "signal_group", length = 30, nullable = false)
    private String signalGroup;

    @Column(name = "signal_value", length = 60, nullable = false)
    private String signalValue;

    protected UserSkinSignalId() {
    }

    public UserSkinSignalId(String userId, String signalGroup, String signalValue) {
        this.userId = userId;
        this.signalGroup = signalGroup;
        this.signalValue = signalValue;
    }

    public String getUserId() { return userId; }
    public String getSignalGroup() { return signalGroup; }
    public String getSignalValue() { return signalValue; }

    @Override
    public boolean equals(Object candidate) {
        if (this == candidate) return true;
        if (!(candidate instanceof UserSkinSignalId other)) return false;
        return Objects.equals(userId, other.userId)
                && Objects.equals(signalGroup, other.signalGroup)
                && Objects.equals(signalValue, other.signalValue);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, signalGroup, signalValue);
    }
}
