package com.github.melobreno.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI apiDefinition() {
        return new OpenAPI()
                .info(new Info()
                        .title("API Passe | Case Senai CÓD. 237")
                        .description("API REST Case Desenvolvido durante processo seletivo.")
                        .version("v1"));
    }
}
