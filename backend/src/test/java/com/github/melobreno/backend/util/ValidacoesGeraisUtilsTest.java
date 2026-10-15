package com.github.melobreno.backend.util;

import org.apache.coyote.BadRequestException;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ValidacoesGeraisUtilsTest {

    @Test
    void validarDateTimeAceitaFormatoBrasiliaDoContrato() throws BadRequestException {
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
}
