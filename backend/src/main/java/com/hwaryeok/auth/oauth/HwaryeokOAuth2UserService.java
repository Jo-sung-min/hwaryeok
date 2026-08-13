package com.hwaryeok.auth.oauth;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class HwaryeokOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    public static final String USER_ID_ATTRIBUTE = "hwaryeok_user_id";
    public static final String PROVIDER_ATTRIBUTE = "hwaryeok_provider";
    public static final String NEW_USER_ATTRIBUTE = "hwaryeok_new_user";

    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
    private final OAuthAccountService oauthAccountService;

    public HwaryeokOAuth2UserService(OAuthAccountService oauthAccountService) {
        this.oauthAccountService = oauthAccountService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) {
        OAuth2User providerUser = delegate.loadUser(request);
        String registrationId = request.getClientRegistration().getRegistrationId();
        OAuthLoginResult result = oauthAccountService.login(OAuthProfile.from(registrationId, providerUser.getAttributes()));

        Map<String, Object> attributes = new LinkedHashMap<>(providerUser.getAttributes());
        attributes.put(USER_ID_ATTRIBUTE, result.user().getId());
        attributes.put(PROVIDER_ATTRIBUTE, result.provider().registrationId());
        attributes.put(NEW_USER_ATTRIBUTE, result.newUser());
        attributes.put("email", result.user().getEmail());
        attributes.put("nickname", result.user().getNickname());

        return new DefaultOAuth2User(providerUser.getAuthorities(), attributes, USER_ID_ATTRIBUTE);
    }
}
