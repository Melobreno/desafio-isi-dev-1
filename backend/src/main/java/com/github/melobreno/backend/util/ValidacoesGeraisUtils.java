package com.github.melobreno.backend.util;

import com.github.melobreno.backend.exceptions.BadRequestException;
import com.github.melobreno.backend.exceptions.BusinessException;
import org.springframework.http.HttpStatus;

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

    /**
     * RN01 - Interpreta estritamente a data e hora local no formato da API
     * e associa o offset fixo de Brasília (-03:00).
     */
    private static OffsetDateTime parse(String valor) {
        return LocalDateTime.parse(valor, formatter).atOffset(ZoneOffset.ofHours(-3));
    }

    /**
     * RN01 - Valida se a data e hora fornecida está no formato correto e possui o fuso horário "-03:00".
     *
     * @param localDate data no formato uuuu-MM-dd'T'HH:mm-03:00
     * @return OffsetDateTime
     */
    public static OffsetDateTime validarDateTime(String localDate) {
        if (localDate == null || localDate.isEmpty()) {
            throw new BadRequestException("O campo de data e hora é obrigatório.");
        }
        if (!FORMATO_DATA_HORA.matcher(localDate).matches()) {
            throw new BadRequestException("Data e hora devem estar no formato AAAA-MM-DDTHH:MM-03:00.");
        }
        try {
            return parse(localDate);
        } catch (DateTimeException exception) {
            throw new BadRequestException("Data e hora inválidos.", exception);
        }
    }

    /**
     * RN01 - Obtém o instante atual com offset -03:00 e precisão de segundos.
     */
    public static OffsetDateTime agoraBrasilia() {
        return OffsetDateTime.now(ZoneOffset.ofHours(-3)).withNano(0);
    }

    /**
     * RN07 - Valida o parâmetro booleano da listagem: aceita apenas "true"
     * ou "false", respeitando maiúsculas e minúsculas.
     * @param valRecebito
     * @param valEsperado
     * @return
     */
    public static boolean validaBooleanoCase(String valRecebito , String valEsperado) {
        if ("true".equals(valEsperado)) return true;
        if ("false".equals(valEsperado)) return false;
        throw new BadRequestException("O parâmetro " + valRecebito + " deve ser true ou false.");
    }

    /**
     * V05 | V08
     * @param esperado
     * @return
     */
    public static Integer idUrl(String esperado) {
        if (esperado == null || !INTEIRO_POSITIVO.matcher(esperado).matches()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado.");
        }
        try {
            return Integer.parseInt(esperado);
        } catch (NumberFormatException exception) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado.", exception);
        }
    }

    public static int inteiroPositivo(String nome, String esperado) {
        if (esperado == null || esperado.length() > 10
                || !INTEIRO_POSITIVO.matcher(esperado).matches()) {
            throw new BadRequestException("O parâmetro " + nome + " deve ser um inteiro positivo.");
        }
        try {
            return Integer.parseInt(esperado);
        } catch (NumberFormatException exception) {
            throw new BadRequestException("O parâmetro " + nome + " deve ser um inteiro positivo.", exception);
        }
    }

    public static int inteiroNaFaixa(String nome, String esperado, int min, int max) {
        int valor = inteiroPositivo(nome, esperado);
        if (valor < min || valor > max) {
            throw new BadRequestException(
                    "O parâmetro " + nome + " deve estar entre " + min + " e " + max + ".");
        }
        return valor;
    }

    public static BigDecimal validaDecimal(String nome, String esperado, BigDecimal min, BigDecimal max) {
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
     * V04 - Remove espaços nas pontas, reduz múltiplos espaços U+0020 a um só,
     * rejeita caracteres de controle com 400 e trata texto em branco como ausente.
     */
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

    /**
     * V04 - Aplica a regra V4 para o parâmetro de busca search.
     * Se for vazio ou contiver apenas espaços ou caracteres de controle, é recusado com 400.
     */
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

    /**
     * Decompõe o texto na forma NFD do Unicode e retira marcas de acento (categoria Mn),
     * incluindo a cedilha.
     */
    public static String removerAcentos(String texto) {
        if (texto == null) {
            return null;
        }
        return java.text.Normalizer.normalize(texto, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }

    /**
     * Normaliza texto para a ordenação alfabética exigida no regulamento:
     * sem acentos e em minúsculas, comparável caractere a caractere Unicode.
     */
    public static String normalizarParaOrdenacao(String texto) {
        if (texto == null) {
            return "";
        }
        return removerAcentos(texto).toLowerCase(java.util.Locale.ROOT);
    }

    /**
     * V05 - Valida se o valor recebido é um dos valores válidos de um enum.
     * @param nome
     * @param tipo
     * @param esperado
     * @return
     * @param <E>
     */
    public static <E extends Enum<E>> E validaEnum(String nome, Class<E> tipo, String esperado) {
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
