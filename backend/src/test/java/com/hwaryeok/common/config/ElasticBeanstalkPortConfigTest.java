package com.hwaryeok.common.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;

import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mock.env.MockEnvironment;

class ElasticBeanstalkPortConfigTest {

    @Test
    void productionDefaultsToElasticBeanstalkProxyPort() throws IOException {
        MockEnvironment environment = applicationEnvironment();

        assertThat(environment.getProperty("server.port")).isEqualTo("5000");
    }

    @Test
    void elasticBeanstalkPortCanOverrideTheProxyDefault() throws IOException {
        MockEnvironment environment = applicationEnvironment();
        environment.setProperty("PORT", "5100");

        assertThat(environment.getProperty("server.port")).isEqualTo("5100");
    }

    private MockEnvironment applicationEnvironment() throws IOException {
        MockEnvironment environment = new MockEnvironment();
        new YamlPropertySourceLoader()
                .load("applicationConfig", new FileSystemResource("src/main/resources/application.yml"))
                .forEach(environment.getPropertySources()::addLast);
        return environment;
    }
}
