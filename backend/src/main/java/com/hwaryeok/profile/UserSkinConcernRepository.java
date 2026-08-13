package com.hwaryeok.profile;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserSkinConcernRepository extends JpaRepository<UserSkinConcern, UserSkinConcernId> {

    List<UserSkinConcern> findByIdUserIdOrderByDisplayOrderAsc(String userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from UserSkinConcern concern where concern.id.userId = :userId")
    int deleteAllByUserId(@Param("userId") String userId);
}
