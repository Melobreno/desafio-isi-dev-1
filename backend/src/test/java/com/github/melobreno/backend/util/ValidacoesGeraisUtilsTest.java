package com.github.melobreno.backend.util;

import com.github.melobreno.backend.exceptions.BadRequestException;
import com.github.melobreno.backend.exceptions.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ValidacoesGeraisUtilsTest {

    @Test
    void validarDateTimeAceitaFormatoBrasiliaDoContrato() {
        OffsetDateTime data = ValidacoesGeraisUtils.validarDateTime("2027-03-02T10:15-03:00");

        assertEquals(OffsetDateTime.of(2027, 3, 2, 10, 15, 0, 0, ZoneOffset.ofHours(-3)), data);
    }

    @Test
    void validarDateTimeRejeitaDatasEFormatosInvalidos() {
        assertThrows(BadRequestException.class,
                () -> ValidacoesGeraisUtils.validarDateTime("2027-02-30T10:15-03:00"));
        assertThrows(BadRequestException.class,
                () -> ValidacoesGeraisUtils.validarDateTime("2027-03-02T10:15:00-03:00"));
        assertThrows(BadRequestException.class,
                () -> ValidacoesGeraisUtils.validarDateTime("2027-03-02T10:15Z"));
    }

    @Test
    void agoraBrasiliaRetornaTimestampComOffsetCorretoEPrecisaoDeSegundos() {
        OffsetDateTime agora = ValidacoesGeraisUtils.agoraBrasilia();

        assertEquals(ZoneOffset.ofHours(-3), agora.getOffset());
        assertEquals(0, agora.getNano());
        assertTrue(agora.isBefore(OffsetDateTime.now(ZoneOffset.ofHours(-3)).plusSeconds(1)));
    }

    @Test
    void idUrlAceitaSomenteInteirosPositivos() {
        assertEquals(42, ValidacoesGeraisUtils.idUrl("42"));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> ValidacoesGeraisUtils.idUrl("0"));
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());

        assertThrows(BusinessException.class,
                () -> ValidacoesGeraisUtils.idUrl("2147483648"));
    }

    @Test
    void inteiroPositivoRejeitaZerosIniciaisESinais() {
        assertEquals(42, ValidacoesGeraisUtils.inteiroPositivo("page", "42"));
        assertThrows(BadRequestException.class,
                () -> ValidacoesGeraisUtils.inteiroPositivo("page", "042"));
        assertThrows(BadRequestException.class,
                () -> ValidacoesGeraisUtils.inteiroPositivo("page", "+42"));
    }
}
