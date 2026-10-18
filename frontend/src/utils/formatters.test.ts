import {
  formatCurrency,
  formatDateTimePtBr,
  formatSignedCurrency,
  getAvatarPaletteIndex,
  getInitials,
  localDateTimeInputToBrasiliaIso,
} from './formatters';

describe('formatCurrency', () => {
  it('usa duas casas e vírgula decimal', () => {
    expect(formatCurrency(40)).toBe('40,00');
    expect(formatCurrency(1234.5)).toBe('1.234,50');
  });

  it('retorna 0,00 para valores ausentes', () => {
    expect(formatCurrency(null)).toBe('0,00');
    expect(formatCurrency(undefined)).toBe('0,00');
  });

  it('inclui o símbolo quando solicitado', () => {
    expect(formatCurrency(12, true)).toBe('R$ 12,00');
  });
});

describe('formatSignedCurrency', () => {
  it('mostra os sinais + e -', () => {
    expect(formatSignedCurrency(5)).toBe('+ 5,00');
    expect(formatSignedCurrency(-5.5)).toBe('- 5,50');
    expect(formatSignedCurrency(0)).toBe('0,00');
  });
});

describe('formatDateTimePtBr', () => {
  it('converte para o horário de Brasília', () => {
    const formatted = formatDateTimePtBr('2026-10-18T17:30:00Z');
    expect(formatted.replace(/\s/g, ' ')).toContain('18/10/2026');
    expect(formatted).toContain('14:30');
  });

  it('retorna traço para valores vazios', () => {
    expect(formatDateTimePtBr(null)).toBe('—');
  });
});

describe('localDateTimeInputToBrasiliaIso', () => {
  it('acrescenta o fuso -03:00', () => {
    expect(localDateTimeInputToBrasiliaIso('2026-10-18T14:30')).toBe(
      '2026-10-18T14:30-03:00'
    );
  });

  it('descarta os segundos e preserva valores já com fuso', () => {
    expect(localDateTimeInputToBrasiliaIso('2026-10-18T14:30:45')).toBe(
      '2026-10-18T14:30-03:00'
    );
    expect(localDateTimeInputToBrasiliaIso('2026-10-18T14:30-03:00')).toBe(
      '2026-10-18T14:30-03:00'
    );
  });

  it('retorna vazio para entrada vazia', () => {
    expect(localDateTimeInputToBrasiliaIso('  ')).toBe('');
  });
});

describe('getInitials / getAvatarPaletteIndex', () => {
  it('gera iniciais a partir do nome', () => {
    expect(getInitials('Meia Zeta')).toBe('MZ');
    expect(getInitials('Pelé')).toBe('PE');
    expect(getInitials('  ')).toBe('?');
  });

  it('é determinístico e limitado a 5 paletas', () => {
    const index = getAvatarPaletteIndex('abc');
    expect(index).toBe(getAvatarPaletteIndex('abc'));
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(5);
  });
});
