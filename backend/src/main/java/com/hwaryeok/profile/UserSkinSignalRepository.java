package com.hwaryeok.profile;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserSkinSignalRepository extends JpaRepository<UserSkinSignal, UserSkinSignalId> {

    List<UserSkinSignal> findByIdUserIdOrderByIdSignalGroupAscDisplayOrderAsc(String userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from UserSkinSignal signal where signal.id.userId = :userId")
    int deleteAllByUserId(@Param("userId") String userId);
}
