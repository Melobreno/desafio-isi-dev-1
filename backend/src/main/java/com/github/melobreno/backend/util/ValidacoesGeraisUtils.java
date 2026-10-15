package com.github.melobreno.backend.util;

import org.apache.coyote.BadRequestException;

import java.math.BigDecimal;
import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.ResolverStyle;
import java.util.regex.Pattern;

public final class ValidacoesGeraisUtils {

    private static final Pattern INTEIRO_POSITIVO = Pattern.compile("[1-9][0-9]*");
    private static final Pattern DECIMAL = Pattern.compile("(0|[1-9][0-9]*)(\\.[0-9]{1,2})?");

    private static final Pattern FORMATO_DATA_HORA = Pattern.compile(
            "[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}-03:00");

    private static final DateTimeFormatter formatter = new DateTimeFormatterBuilder()
            .append(DateTimeFormatter.ISO_LOCAL_DATE)
            .appendLiteral('T')
            .appendPattern("HH:mm")
            .appendLiteral("-03:00")
            .toFormatter()
            .withResolverStyle(ResolverStyle.STRICT);

    private static OffsetDateTime parse(String valor) {
        return LocalDateTime.parse(valor, formatter).atOffset(ZoneOffset.ofHours(-3));
    }

    /**
     * RN01 - Valida se a data e hora fornecida está no formato correto e possui o fuso horário "-03:00".
     *
     * @param localDate data no formato uuuu-MM-dd'T'HH:mm-03:00
     * @return OffsetDateTime
     * @throws BadRequestException
     */
    public static OffsetDateTime validarDateTime(String localDate) throws BadRequestException {
        if (localDate == null || localDate.isEmpty()) {
            throw new BadRequestException("O campo de data e hora é obrigatório.");
        }
        if (!FORMATO_DATA_HORA.matcher(localDate).matches()) {
            throw new BadRequestException("Data e hora devem estar no formato AAAA-MM-DDTHH:MM-03:00.");
        }
        try {
            return parse(localDate);
        } catch (DateTimeException exception) {
            throw new BadRequestException("Data e hora inválidos.");
        }
    }

    public static OffsetDateTime agoraBrasilia() {
        return OffsetDateTime.now(ZoneOffset.ofHours(-3)).withNano(0);
    }

    /**
     * RN05 - Valida se o valor recebido é "true" ou "false" (case sensitive).
     * @param valRecebito
     * @param valEsperado
     * @return
     * @throws BadRequestException
     */
    public static boolean validaBooleanoCase(String valRecebito , String valEsperado) throws BadRequestException{
        if ("true".equals(valEsperado)) return true;
        if ("false".equals(valEsperado)) return false;
        throw new BadRequestException("O parâmetro " + valRecebito + " deve ser true ou false.");
    }

    /**
     * V05 | V08
     * @param esperado
     * @return
     * @throws BadRequestException
     */
    public static int idUrl(String esperado) throws BadRequestException {
        Integer id = lerInteiro(esperado);
        if (id == null) {
            throw new BadRequestException("Recurso não encontrado.");
        }
        return id;
    }

    private static Integer lerInteiro(String esperado) {
        if (esperado == null || esperado.length() > 10 || !INTEIRO_POSITIVO.matcher(esperado).matches()){
            return null;
        }
        long valor = Long.parseLong(esperado);
        return valor <= Integer.MAX_VALUE ? (int) valor : null;
    }

    public static int inteiroPositivo(String nome, String esperado) throws BadRequestException {
        Integer valor = lerInteiro(esperado);
        if (valor == null) {
            throw new BadRequestException("O parâmetro " + nome + " deve ser um inteiro positivo (ex.: 1, 25).");
        }
        return valor;
    }

    public static int inteiroNaFaixa(String nome, String esperado, int min, int max) throws BadRequestException {
        int valor = inteiroPositivo(nome, esperado);
        if (valor < min || valor > max) {
            throw new BadRequestException("O parâmetro " + nome + " deve estar entre " + min + " e " + max + ".");
        }
        return valor;
    }

    public static BigDecimal ValidaDecimal(String nome, String esperado, BigDecimal min, BigDecimal max) throws BadRequestException {
        if (esperado == null || !DECIMAL.matcher(esperado).matches()) {
            throw new BadRequestException("O parâmetro " + nome + " deve ser decimal com até 2 casas (ex.: 10.55).");
        }
        BigDecimal valor = new BigDecimal(esperado);
        if (valor.compareTo(min) < 0 || valor.compareTo(max) > 0) {
            throw new BadRequestException("O parâmetro " + nome + " deve estar entre " + min + " e " + max + ".");
        }
        return valor;
    }

    /**
     * V05 -Valida se o valor recebido é um dos valores válidos de um enum.
     * @param nome
     * @param tipo
     * @param esperado
     * @return
     * @param <E>
     * @throws BadRequestException
     */
    public static <E extends Enum<E>> E validaEnum(String nome, Class<E> tipo, String esperado) throws BadRequestException {
        if (esperado != null) {
            for (E valor : tipo.getEnumConstants()) {
                if (valor.name().equals(esperado)) {
                    return valor;
                }
            }
        }
        throw new BadRequestException(String.format("Campo %s inválido para %s", nome, tipo.getSimpleName()));
    }

}
