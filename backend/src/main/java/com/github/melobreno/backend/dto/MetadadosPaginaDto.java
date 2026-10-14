package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record MetadadosPaginaDto(Integer page, Integer limit, Long totalItems, Integer totalPages) {
}
