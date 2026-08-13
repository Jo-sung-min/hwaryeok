package com.hwaryeok.profile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import com.hwaryeok.auth.InvalidCredentialsException;
import com.hwaryeok.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SkinProfileService {

    private final UserSkinProfileRepository profileRepository;
    private final UserSkinConcernRepository concernRepository;
    private final UserRepository userRepository;

    public SkinProfileService(
            UserSkinProfileRepository profileRepository,
            UserSkinConcernRepository concernRepository,
            UserRepository userRepository
    ) {
        this.profileRepository = profileRepository;
        this.concernRepository = concernRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public SkinProfileResponse get(String userId) {
        UserSkinProfile profile = profileRepository.findById(userId).orElse(null);
        if (profile == null) return SkinProfileResponse.empty();
        return response(profile);
    }

    @Transactional
    public SkinProfileResponse save(String userId, SkinProfileRequest request) {
        boolean activeUser = userRepository.findById(userId)
                .filter(user -> "ACTIVE".equals(user.getStatus()))
                .isPresent();
        if (!activeUser) throw new InvalidCredentialsException();

        List<String> concerns = request.concerns().stream()
                .map(String::strip)
                .toList();
        if (new LinkedHashSet<>(concerns).size() != concerns.size()) {
            throw new IllegalArgumentException("같은 피부 고민을 중복해서 선택할 수 없어요.");
        }

        Instant now = Instant.now();
        UserSkinProfile profile = profileRepository.findById(userId)
                .orElseGet(() -> new UserSkinProfile(userId, request.skinType(), now, now));
        profile.update(request.skinType(), now);
        profileRepository.saveAndFlush(profile);

        concernRepository.deleteAllByUserId(userId);
        List<UserSkinConcern> savedConcerns = new ArrayList<>();
        for (int index = 0; index < concerns.size(); index++) {
            savedConcerns.add(new UserSkinConcern(userId, concerns.get(index), index));
        }
        concernRepository.saveAllAndFlush(savedConcerns);
        return response(profile);
    }

    private SkinProfileResponse response(UserSkinProfile profile) {
        List<String> concerns = concernRepository.findByIdUserIdOrderByDisplayOrderAsc(profile.getUserId()).stream()
                .map(UserSkinConcern::getConcern)
                .toList();
        return new SkinProfileResponse(
                true,
                profile.getSkinType(),
                concerns,
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
