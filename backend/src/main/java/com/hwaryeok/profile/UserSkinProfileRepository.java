package com.hwaryeok.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface UserSkinProfileRepository extends JpaRepository<UserSkinProfile, String> {
    interface TypeCount {
        String getSkinType();
        long getProfileCount();
    }

    @Query(value = """
            SELECT p.skinType AS skinType, COUNT(p) AS profileCount
            FROM UserSkinProfile p JOIN User u ON u.id = p.userId
            WHERE u.status = 'ACTIVE' AND u.role = 'USER' AND p.profileVersion >= 2
            GROUP BY p.skinType
            """)
    List<TypeCount> countSavedSkinTypes();
}
