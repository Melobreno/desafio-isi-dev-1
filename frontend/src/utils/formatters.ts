import type { PlayerCondition, PlayerPosition } from '../types/api';

/**
 * Formats a number in fictional currency ("moedas") with 2 decimal places and comma separator (pt-BR),
 * e.g., "R$ 40,00" or "40,00".
 */
export function formatCurrency(
  value: number | null | undefined,
  withSymbol = false
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return withSymbol ? 'R$ 0,00' : '0,00';
  }
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
  return withSymbol ? `R$ ${formatted}` : formatted;
}

/**
 * Formats cash variation with explicit "+" or "-" sign, 2 decimal places, and comma separator (F09).
 */
export function formatSignedCurrency(
  value: number | null | undefined,
  withSymbol = false
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return withSymbol ? 'R$ 0,00' : '0,00';
  }
  const num = Number(value);
  const absFormatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(num));
  const prefix = withSymbol ? 'R$ ' : '';

  if (num > 0) return `+ ${prefix}${absFormatted}`;
  if (num < 0) return `- ${prefix}${absFormatted}`;
  return `${prefix}${absFormatted}`;
}

/**
 * Formats an ISO-8601 date string in Brasília timezone (America/Sao_Paulo, -03:00).
 */
export function formatDateTimePtBr(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Converts a datetime-local value ("YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss")
 * into RN01 Brasília format: "AAAA-MM-DDTHH:MM-03:00".
 */
export function localDateTimeInputToBrasiliaIso(localValue: string): string {
  const trimmed = localValue.trim();
  if (!trimmed) return '';
  if (trimmed.endsWith('-03:00')) return trimmed;
  // Keep only YYYY-MM-DDTHH:MM
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  if (match) {
    return `${match[1]}-03:00`;
  }
  return `${trimmed}-03:00`;
}

/**
 * Returns a default future datetime-local string ("YYYY-MM-DDTHH:mm") in Brasília time (+daysAhead).
 */
export function getDefaultLoyaltyDateTimeLocal(daysAhead = 90): string {
  const futureMs = Date.now() + daysAhead * 24 * 60 * 60 * 1000;
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(futureMs));

  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  MEI: 'Meio-campo',
  ATA: 'Atacante',
};

export const POSITION_SHORT_LABELS: Record<PlayerPosition, string> = {
  GOL: 'GOL',
  ZAG: 'ZAG',
  LAT: 'LAT',
  MEI: 'MEI',
  ATA: 'ATA',
};

export const CONDITION_LABELS: Record<PlayerCondition, string> = {
  APTO: 'Apto',
  MAL_CONDICIONADO: 'Mal condicionado',
  DOENTE: 'Doente',
};

export const CONDITION_SHORT_LABELS: Record<PlayerCondition, string> = {
  APTO: 'Apto',
  MAL_CONDICIONADO: 'Mal cond.',
  DOENTE: 'Doente',
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatPlayerShortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

export function getAvatarPaletteIndex(seed: string | number): number {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 5;
}
