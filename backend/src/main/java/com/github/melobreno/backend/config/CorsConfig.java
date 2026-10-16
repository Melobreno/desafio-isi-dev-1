package com.github.melobreno.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer(
            @Value("${app.cors.allowed-origin:http://localhost:5173}") String allowedOrigin) {
        if ("*".equals(allowedOrigin.trim())) {
            throw new IllegalArgumentException("CORS_ALLOWED_ORIGIN must specify one exact origin.");
        }
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/v1/**")
                        .allowedOrigins(allowedOrigin)
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("Accept", "Content-Type")
                        .exposedHeaders("Location");
            }
        };
    }
}
