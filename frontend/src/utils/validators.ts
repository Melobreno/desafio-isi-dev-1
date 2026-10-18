import type { FormationType, PlayerCondition, PlayerPosition } from '../types/api';

export type ValidationErrors<T extends string = string> = Record<T, string | undefined>;

function normalizeTextV4(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function validateIntegerRange(
  raw: string | number,
  min: number,
  max: number,
  fieldLabel: string
): string | undefined {
  if (raw === '' || raw === null || raw === undefined) {
    return `${fieldLabel} é obrigatório.`;
  }
  const num = Number(raw);
  if (!Number.isInteger(num)) {
    return `${fieldLabel} deve ser um número inteiro.`;
  }
  if (num < min || num > max) {
    return `${fieldLabel} deve estar entre ${min} e ${max}.`;
  }
  return undefined;
}

export function validatePlayerForm(values: {
  name: string;
  position: string;
  agility: string | number;
  age: string | number;
  pace?: string | number;
  shooting?: string | number;
  passing?: string | number;
  dribbling?: string | number;
  defending?: string | number;
  physical?: string | number;
  potential?: string | number;
  isEdit?: boolean;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  const cleanName = normalizeTextV4(values.name);
  if (!cleanName) {
    errors.name = 'Informe o nome do jogador.';
  } else if (cleanName.length < 3 || cleanName.length > 100) {
    errors.name = 'O nome do jogador deve ter entre 3 e 100 caracteres.';
  }

  const validPositions: PlayerPosition[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'];
  if (!values.position || !validPositions.includes(values.position as PlayerPosition)) {
    errors.position = 'Selecione uma posição válida.';
  }

  const agilityErr = validateIntegerRange(values.agility, 1, 100, 'A agilidade');
  if (agilityErr) errors.agility = agilityErr;

  const ageErr = validateIntegerRange(values.age, 16, 45, 'A idade');
  if (ageErr) errors.age = ageErr;

  if (!values.isEdit) {
    const attrKeys: Array<{
      key: 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical';
      label: string;
    }> = [
      { key: 'pace', label: 'Velocidade' },
      { key: 'shooting', label: 'Finalização' },
      { key: 'passing', label: 'Passe' },
      { key: 'dribbling', label: 'Drible' },
      { key: 'defending', label: 'Defesa' },
      { key: 'physical', label: 'Físico' },
    ];

    for (const { key, label } of attrKeys) {
      const err = validateIntegerRange(values[key] ?? '', 1, 99, label);
      if (err) errors[key] = err;
    }

    const potErr = validateIntegerRange(values.potential ?? '', 1, 99, 'O potencial');
    if (potErr) errors.potential = potErr;
  }

  return errors;
}

export function validateConditionForm(values: {
  condition: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const validConditions: PlayerCondition[] = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'];
  if (!values.condition || !validConditions.includes(values.condition as PlayerCondition)) {
    errors.condition = 'Selecione uma condição física válida.';
  }
  return errors;
}

export function validateClubForm(values: {
  name: string;
  acronym: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const cleanName = normalizeTextV4(values.name);
  if (!cleanName) {
    errors.name = 'Informe o nome do clube.';
  } else if (cleanName.length < 3 || cleanName.length > 60) {
    errors.name = 'O nome do clube deve ter entre 3 e 60 caracteres.';
  }

  const cleanAcronym = values.acronym.trim();
  if (!cleanAcronym) {
    errors.acronym = 'Informe a sigla do clube.';
  } else if (cleanAcronym.length !== 3) {
    errors.acronym = 'A sigla deve conter exatamente 3 letras.';
  }

  return errors;
}

export function validateBuyPlayerForm(values: {
  clubId: string | number;
  loyaltyUntil: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.clubId || Number(values.clubId) < 1) {
    errors.clubId = 'Selecione o clube comprador.';
  }

  if (!values.loyaltyUntil || !values.loyaltyUntil.trim()) {
    errors.loyaltyUntil = 'Informe a data e hora de fim da fidelidade.';
  }

  return errors;
}

export function validateLineupForm(values: {
  formation: string;
  slots: Array<number | null | ''>;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const validFormations: FormationType[] = ['3-1', '2-2', '2-1-1', '1-2-1'];
  if (!values.formation || !validFormations.includes(values.formation as FormationType)) {
    errors.formation = 'Selecione uma formação tática.';
  }

  const filled = values.slots.filter((id): id is number => typeof id === 'number' && id > 0);
  if (filled.length !== 5) {
    errors.slots = 'Selecione um titular para cada uma das 5 vagas da escalação.';
  } else if (new Set(filled).size !== 5) {
    errors.slots = 'Um mesmo jogador não pode ocupar mais de uma vaga na escalação.';
  }

  return errors;
}

export function validateMatchForm(values: {
  homeClubId: string | number;
  awayClubId: string | number;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.homeClubId || Number(values.homeClubId) < 1) {
    errors.homeClubId = 'Selecione o clube mandante.';
  }
  if (!values.awayClubId || Number(values.awayClubId) < 1) {
    errors.awayClubId = 'Selecione o clube visitante.';
  }
  return errors;
}
