package com.hwaryeok.profile;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_skin_concerns")
public class UserSkinConcern {

    @EmbeddedId
    private UserSkinConcernId id;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected UserSkinConcern() {
    }

    public UserSkinConcern(String userId, String concern, int displayOrder) {
        this.id = new UserSkinConcernId(userId, concern);
        this.displayOrder = displayOrder;
    }

    public String getUserId() { return id.getUserId(); }
    public String getConcern() { return id.getConcern(); }
    public int getDisplayOrder() { return displayOrder; }
}
