package com.hwaryeok.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class TrustedProxyClientAddressResolverTest {

    private static final String SECRET = "test-bff-proxy-secret-with-32-characters";

    @Test
    void acceptsTheForwardedAddressOnlyWithTheSharedSecret() {
        TrustedProxyClientAddressResolver resolver = new TrustedProxyClientAddressResolver(SECRET);
        MockHttpServletRequest request = request("10.0.0.5");
        request.addHeader(TrustedProxyClientAddressResolver.PROXY_SECRET_HEADER, SECRET);
        request.addHeader(TrustedProxyClientAddressResolver.CLIENT_ADDRESS_HEADER, "203.0.113.8");

        assertThat(resolver.resolve(request)).isEqualTo("203.0.113.8");
    }

    @Test
    void ignoresSpoofedOrMalformedForwardingHeaders() {
        TrustedProxyClientAddressResolver resolver = new TrustedProxyClientAddressResolver(SECRET);
        MockHttpServletRequest wrongSecret = request("10.0.0.5");
        wrongSecret.addHeader(TrustedProxyClientAddressResolver.PROXY_SECRET_HEADER, "wrong-secret");
        wrongSecret.addHeader(TrustedProxyClientAddressResolver.CLIENT_ADDRESS_HEADER, "203.0.113.8");
        assertThat(resolver.resolve(wrongSecret)).isEqualTo("10.0.0.5");

        MockHttpServletRequest malformedAddress = request("10.0.0.6");
        malformedAddress.addHeader(TrustedProxyClientAddressResolver.PROXY_SECRET_HEADER, SECRET);
        malformedAddress.addHeader(TrustedProxyClientAddressResolver.CLIENT_ADDRESS_HEADER, "not-an-ip");
        assertThat(resolver.resolve(malformedAddress)).isEqualTo("10.0.0.6");
    }

    @Test
    void rejectsAWeakConfiguredSecret() {
        assertThatThrownBy(() -> new TrustedProxyClientAddressResolver("too-short"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 characters");
    }

    private MockHttpServletRequest request(String remoteAddress) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(remoteAddress);
        return request;
    }
}
