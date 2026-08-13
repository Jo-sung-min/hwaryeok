package com.hwaryeok.auth.oauth;

import com.hwaryeok.user.User;

public record OAuthLoginResult(User user, OAuthProvider provider, boolean newUser) {
}
