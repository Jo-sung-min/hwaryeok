package com.hwaryeok.auth.oauth;

import java.util.Collection;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

public class ConfiguredClientRegistrationRepository
        implements ClientRegistrationRepository, Iterable<ClientRegistration> {

    private final Map<String, ClientRegistration> registrations;

    public ConfiguredClientRegistrationRepository(Collection<ClientRegistration> registrations) {
        Map<String, ClientRegistration> indexed = new LinkedHashMap<>();
        registrations.forEach(registration -> indexed.put(registration.getRegistrationId(), registration));
        this.registrations = Map.copyOf(indexed);
    }

    @Override
    public ClientRegistration findByRegistrationId(String registrationId) {
        return registrations.get(registrationId);
    }

    public boolean isConfigured(String registrationId) {
        return registrations.containsKey(registrationId);
    }

    public List<String> configuredRegistrationIds() {
        return List.copyOf(registrations.keySet());
    }

    @Override
    public Iterator<ClientRegistration> iterator() {
        return registrations.values().iterator();
    }
}
