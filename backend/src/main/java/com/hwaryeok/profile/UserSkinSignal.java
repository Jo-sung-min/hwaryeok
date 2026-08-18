package com.hwaryeok.profile;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_skin_profile_signals")
public class UserSkinSignal {

    @EmbeddedId
    private UserSkinSignalId id;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected UserSkinSignal() {
    }

    public UserSkinSignal(String userId, String signalGroup, String signalValue, int displayOrder) {
        this.id = new UserSkinSignalId(userId, signalGroup, signalValue);
        this.displayOrder = displayOrder;
    }

    public String getSignalGroup() { return id.getSignalGroup(); }
    public String getSignalValue() { return id.getSignalValue(); }
    public int getDisplayOrder() { return displayOrder; }
}
