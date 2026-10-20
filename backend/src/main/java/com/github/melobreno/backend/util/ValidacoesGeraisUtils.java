package com.github.melobreno.backend.util;

import com.github.melobreno.backend.exceptions.BadRequestException;
import com.github.melobreno.backend.exceptions.BusinessException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.ResolverStyle;
import java.util.Locale;
import java.util.regex.Pattern;

public final class ValidacoesGeraisUtils {

    private static final Pattern INTEIRO_POSITIVO = Pattern.compile("[1-9][0-9]*");
    private static final Pattern DECIMAL = Pattern.compile("(0|[1-9][0-9]*)(\\.[0-9]{1,2})?");
    private static final Pattern FORMATO_DATA_HORA = Pattern.compile(
            "[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}-03:00");

    private static final DateTimeFormatter FORMATADOR = new DateTimeFormatterBuilder()
            .append(DateTimeFormatter.ISO_LOCAL_DATE)
            .appendLiteral('T')
            .appendPattern("HH:mm")
            .appendLiteral("-03:00")
            .toFormatter()
            .withResolverStyle(ResolverStyle.STRICT);

    private ValidacoesGeraisUtils() {
    }

    private static OffsetDateTime parse(String valor) {
        return LocalDateTime.parse(valor, FORMATADOR).atOffset(ZoneOffset.ofHours(-3));
    }

    public static OffsetDateTime validarDateTime(String dataHoraTexto) {
        if (dataHoraTexto == null || dataHoraTexto.isEmpty()) {
            throw new BadRequestException("O campo de data e hora é obrigatório.");
        }
        if (!FORMATO_DATA_HORA.matcher(dataHoraTexto).matches()) {
            throw new BadRequestException("Data e hora devem estar no formato AAAA-MM-DDTHH:MM-03:00.");
        }
        try {
            return parse(dataHoraTexto);
        } catch (DateTimeException exception) {
            throw new BadRequestException("Data e hora inválidos.", exception);
        }
    }

    public static OffsetDateTime agoraBrasilia() {
        return OffsetDateTime.now(ZoneOffset.ofHours(-3)).withNano(0);
    }

    public static boolean validaBooleanoCase(String nomeParametro, String valorRecebido) {
        if ("true".equals(valorRecebido)) return true;
        if ("false".equals(valorRecebido)) return false;
        throw new BadRequestException("O parâmetro " + nomeParametro + " deve ser true ou false.");
    }

    public static int validarIdRota(String valor, String mensagemNaoEncontrado) {
        if (valor == null || valor.length() > 10 || !INTEIRO_POSITIVO.matcher(valor).matches()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, mensagemNaoEncontrado);
        }
        try {
            long parsed = Long.parseLong(valor);
            if (parsed > Integer.MAX_VALUE) {
                throw new BusinessException(HttpStatus.NOT_FOUND, mensagemNaoEncontrado);
            }
            return (int) parsed;
        } catch (NumberFormatException exception) {
            throw new BusinessException(HttpStatus.NOT_FOUND, mensagemNaoEncontrado, exception);
        }
    }

    public static Integer idUrl(String esperado) {
        return validarIdRota(esperado, "Jogador não encontrado.");
    }

    public static int inteiroPositivo(String nomeParametro, String valor) {
        return validarInteiroPositivoQuery(nomeParametro, valor);
    }

    public static int validarInteiroPositivoQuery(String nomeParametro, String valor) {
        if (valor == null || valor.length() > 10 || !INTEIRO_POSITIVO.matcher(valor).matches()) {
            throw new BadRequestException("O parâmetro " + nomeParametro + " deve ser um inteiro positivo.");
        }
        try {
            long parsed = Long.parseLong(valor);
            if (parsed > Integer.MAX_VALUE) {
                throw new BadRequestException("O parâmetro " + nomeParametro + " deve ser um inteiro positivo.");
            }
            return (int) parsed;
        } catch (NumberFormatException exception) {
            throw new BadRequestException("O parâmetro " + nomeParametro + " deve ser um inteiro positivo.", exception);
        }
    }

    public static BigDecimal validaDecimal(String nomeParametro, String valor, BigDecimal minimo, BigDecimal maximo) {
        if (valor == null || !DECIMAL.matcher(valor).matches()) {
            throw new BadRequestException("O parâmetro " + nomeParametro + " deve ser decimal com até 2 casas (ex.: 10.55).");
        }
        BigDecimal valorDecimal = new BigDecimal(valor);
        if (valorDecimal.compareTo(minimo) < 0 || valorDecimal.compareTo(maximo) > 0) {
            throw new BadRequestException("O parâmetro " + nomeParametro + " deve estar entre " + minimo + " e " + maximo + ".");
        }
        return valorDecimal;
    }

    public static String aplicarV4(String texto, String nomeCampo) {
        if (texto == null) {
            throw new BadRequestException("O campo " + nomeCampo + " é obrigatório.");
        }
        if (texto.codePoints().anyMatch(Character::isISOControl)) {
            throw new BadRequestException("O campo " + nomeCampo + " não pode conter caracteres de controle.");
        }
        String normalizado = texto.replaceAll("^ +| +$", "").replaceAll(" {2,}", " ");
        if (normalizado.isEmpty()) {
            throw new BadRequestException("O campo " + nomeCampo + " é obrigatório.");
        }
        return normalizado;
    }

    public static String aplicarV4Search(String search) {
        if (search == null) {
            return null;
        }
        if (search.codePoints().anyMatch(Character::isISOControl)) {
            throw new BadRequestException("A busca não pode conter caracteres de controle.");
        }
        String normalizado = search.replaceAll("^ +| +$", "").replaceAll(" {2,}", " ");
        if (normalizado.isEmpty()) {
            throw new BadRequestException("O parâmetro search não pode ser vazio.");
        }
        return normalizado;
    }

    public static String removerAcentos(String texto) {
        if (texto == null) {
            return null;
        }
        return Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }

    public static String normalizarParaOrdenacao(String texto) {
        if (texto == null) {
            return "";
        }
        return removerAcentos(texto).toLowerCase(Locale.ROOT);
    }

    public static <E extends Enum<E>> E validaEnum(String nomeCampo, Class<E> tipo, String esperado) {
        if (esperado != null) {
            for (E valor : tipo.getEnumConstants()) {
                if (valor.name().equals(esperado)) {
                    return valor;
                }
            }
        }
        throw new BadRequestException(String.format("Campo %s inválido para %s", nomeCampo, tipo.getSimpleName()));
    }
}
