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
    void elasticBeanstalkPortTakesPrecedenceOverTheLocalServerPort() throws IOException {
        MockEnvironment environment = applicationEnvironment();
        environment.setProperty("SERVER_PORT", "8081");
        environment.setProperty("PORT", "5000");

        assertThat(environment.getProperty("server.port")).isEqualTo("5000");
    }

    @Test
    void serverPortRemainsAvailableOutsideElasticBeanstalk() throws IOException {
        MockEnvironment environment = applicationEnvironment();
        environment.setProperty("SERVER_PORT", "8081");

        assertThat(environment.getProperty("server.port")).isEqualTo("8081");
    }

    private MockEnvironment applicationEnvironment() throws IOException {
        MockEnvironment environment = new MockEnvironment();
        new YamlPropertySourceLoader()
                .load("applicationConfig", new FileSystemResource("src/main/resources/application.yml"))
                .forEach(environment.getPropertySources()::addLast);
        return environment;
    }
}
