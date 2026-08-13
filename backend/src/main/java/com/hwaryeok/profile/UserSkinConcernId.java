package com.hwaryeok.profile;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class UserSkinConcernId implements Serializable {

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(length = 40, nullable = false)
    private String concern;

    protected UserSkinConcernId() {
    }

    public UserSkinConcernId(String userId, String concern) {
        this.userId = userId;
        this.concern = concern;
    }

    public String getUserId() { return userId; }
    public String getConcern() { return concern; }

    @Override
    public boolean equals(Object candidate) {
        if (this == candidate) return true;
        if (!(candidate instanceof UserSkinConcernId other)) return false;
        return Objects.equals(userId, other.userId) && Objects.equals(concern, other.concern);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, concern);
    }
}
