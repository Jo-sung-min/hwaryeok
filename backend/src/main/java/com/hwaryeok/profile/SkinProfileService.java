package com.hwaryeok.profile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import com.hwaryeok.user.ActiveUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SkinProfileService {

    private final UserSkinProfileRepository profileRepository;
    private final UserSkinConcernRepository concernRepository;
    private final UserSkinSignalRepository signalRepository;
    private final ActiveUserService activeUserService;

    public SkinProfileService(
            UserSkinProfileRepository profileRepository,
            UserSkinConcernRepository concernRepository,
            UserSkinSignalRepository signalRepository,
            ActiveUserService activeUserService
    ) {
        this.profileRepository = profileRepository;
        this.concernRepository = concernRepository;
        this.signalRepository = signalRepository;
        this.activeUserService = activeUserService;
    }

    @Transactional(readOnly = true)
    public SkinProfileResponse get(String userId) {
        activeUserService.requireActive(userId);
        UserSkinProfile profile = profileRepository.findById(userId).orElse(null);
        if (profile == null) return SkinProfileResponse.empty();
        return response(profile);
    }

    @Transactional
    public SkinProfileResponse save(String userId, SkinProfileRequest request) {
        activeUserService.requireActiveForUpdate(userId);

        List<String> concerns = request.concerns().stream()
                .map(String::strip)
                .toList();
        if (new LinkedHashSet<>(concerns).size() != concerns.size()) {
            throw new IllegalArgumentException("같은 피부 고민을 중복해서 선택할 수 없어요.");
        }

        Instant now = Instant.now();
        String hydrationLevel = valueOrDefault(request.hydrationLevel(), "BALANCED");
        String oilinessLevel = valueOrDefault(request.oilinessLevel(), "BALANCED");
        String sensitivityLevel = valueOrDefault(request.sensitivityLevel(), "MEDIUM");
        String breakoutFrequency = valueOrDefault(request.breakoutFrequency(), "OCCASIONAL");
        String cleansingTightness = valueOrDefault(request.cleansingTightness(), "SHORT");
        String rednessFrequency = valueOrDefault(request.rednessFrequency(), "OCCASIONAL");
        String poreLevel = valueOrDefault(request.poreLevel(), "MEDIUM");
        String texturePreference = valueOrDefault(request.texturePreference(), "BALANCED");
        String routineComplexity = valueOrDefault(request.routineComplexity(), "STANDARD");
        String sunscreenUsage = valueOrDefault(request.sunscreenUsage(), "SOMETIMES");
        UserSkinProfile profile = profileRepository.findById(userId)
                .orElseGet(() -> new UserSkinProfile(userId, request.skinType(), now, now));
        profile.update(
                request.skinType(),
                hydrationLevel,
                oilinessLevel,
                sensitivityLevel,
                breakoutFrequency,
                cleansingTightness,
                rednessFrequency,
                poreLevel,
                texturePreference,
                routineComplexity,
                sunscreenUsage,
                now
        );
        profileRepository.saveAndFlush(profile);

        concernRepository.deleteAllByUserId(userId);
        List<UserSkinConcern> savedConcerns = new ArrayList<>();
        for (int index = 0; index < concerns.size(); index++) {
            savedConcerns.add(new UserSkinConcern(userId, concerns.get(index), index));
        }
        concernRepository.saveAllAndFlush(savedConcerns);

        signalRepository.deleteAllByUserId(userId);
        List<UserSkinSignal> signals = new ArrayList<>();
        addSignals(signals, userId, "REACTION_TRIGGER", safeList(request.reactionTriggers()));
        addSignals(signals, userId, "BREAKOUT_ZONE", safeList(request.breakoutZones()));
        addSignals(signals, userId, "ENVIRONMENT", safeList(request.environments()));
        addSignals(signals, userId, "ROUTINE_CONTEXT", safeList(request.routineContexts()));
        signalRepository.saveAllAndFlush(signals);
        return response(profile);
    }

    private SkinProfileResponse response(UserSkinProfile profile) {
        List<String> concerns = concernRepository.findByIdUserIdOrderByDisplayOrderAsc(profile.getUserId()).stream()
                .map(UserSkinConcern::getConcern)
                .toList();
        List<UserSkinSignal> signals = signalRepository.findByIdUserIdOrderByIdSignalGroupAscDisplayOrderAsc(profile.getUserId());
        return new SkinProfileResponse(
                true,
                profile.getSkinType(),
                profile.getHydrationLevel(),
                profile.getOilinessLevel(),
                profile.getSensitivityLevel(),
                profile.getBreakoutFrequency(),
                profile.getProfileVersion(),
                profile.getCleansingTightness(),
                profile.getRednessFrequency(),
                profile.getPoreLevel(),
                profile.getTexturePreference(),
                profile.getRoutineComplexity(),
                profile.getSunscreenUsage(),
                signalValues(signals, "REACTION_TRIGGER"),
                signalValues(signals, "BREAKOUT_ZONE"),
                signalValues(signals, "ENVIRONMENT"),
                signalValues(signals, "ROUTINE_CONTEXT"),
                concerns,
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private List<String> safeList(List<String> values) {
        if (values == null) return List.of();
        List<String> normalized = values.stream().map(String::strip).filter(value -> !value.isBlank()).toList();
        if (new LinkedHashSet<>(normalized).size() != normalized.size()) {
            throw new IllegalArgumentException("같은 세부 피부 신호를 중복해서 선택할 수 없어요.");
        }
        return normalized;
    }

    private void addSignals(List<UserSkinSignal> target, String userId, String group, List<String> values) {
        for (int index = 0; index < values.size(); index++) {
            target.add(new UserSkinSignal(userId, group, values.get(index), index));
        }
    }

    private List<String> signalValues(List<UserSkinSignal> signals, String group) {
        return signals.stream()
                .filter(signal -> group.equals(signal.getSignalGroup()))
                .map(UserSkinSignal::getSignalValue)
                .toList();
    }
}
