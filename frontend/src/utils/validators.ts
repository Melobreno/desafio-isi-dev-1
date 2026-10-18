import type { FormationType, PlayerCondition, PlayerPosition } from '../types/api';

export type ValidationErrors<T extends string = string> = Record<T, string | undefined>;

function normalizeTextV4(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function validatePlayerForm(values: {
  name: string;
  position: string;
  agility: string | number;
  age: string | number;
  currentAge?: number;
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
    errors.name = 'Informe o nome.';
  } else if (cleanName.length < 3 || cleanName.length > 100) {
    errors.name = 'Use de 3 a 100 caracteres.';
  } else if (/\d/.test(cleanName)) {
    errors.name = 'O nome não pode conter números.';
  } else if (cleanName.split(' ').length < 2) {
    errors.name = 'Informe pelo menos duas palavras.';
  }

  const validPositions: PlayerPosition[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'];
  if (!values.position || !validPositions.includes(values.position as PlayerPosition)) {
    errors.position = 'Selecione uma posição.';
  }

  let validAge: number | null = null;
  if (
    String(values.age).trim() === '' ||
    values.age === null ||
    values.age === undefined
  ) {
    errors.age = 'Informe a idade.';
  } else {
    const ageNum = Number(values.age);
    if (!Number.isInteger(ageNum) || ageNum < 16 || ageNum > 45) {
      errors.age = 'Use uma idade de 16 a 45 anos.';
    } else if (
      values.isEdit &&
      typeof values.currentAge === 'number' &&
      ageNum < values.currentAge
    ) {
      errors.age = `A idade não pode diminuir (atual: ${values.currentAge}).`;
    } else {
      validAge = ageNum;
    }
  }

  if (
    String(values.agility).trim() === '' ||
    values.agility === null ||
    values.agility === undefined
  ) {
    errors.agility = 'Informe a agilidade.';
  } else {
    const agiNum = Number(values.agility);
    if (!Number.isInteger(agiNum) || agiNum < 1 || agiNum > 100) {
      errors.agility = 'Use um valor de 1 a 100.';
    } else if (validAge !== null && validAge >= 35 && agiNum > 85) {
      errors.agility = 'Máximo 85 para 35 anos ou mais.';
    }
  }

  if (!values.isEdit) {
    const attrKeys: Array<{
      key: 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical';
      emptyLabel: string;
      displayName: string;
    }> = [
      { key: 'pace', emptyLabel: ' a velocidade', displayName: 'Velocidade' },
      { key: 'shooting', emptyLabel: ' a finalização', displayName: 'Finalização' },
      { key: 'passing', emptyLabel: ' o passe', displayName: 'Passe' },
      { key: 'dribbling', emptyLabel: ' o drible', displayName: 'Drible' },
      { key: 'defending', emptyLabel: ' a defesa', displayName: 'Defesa' },
      { key: 'physical', emptyLabel: ' o físico', displayName: 'Físico' },
    ];

    let validPotential: number | null = null;
    if (
      values.potential === undefined ||
      values.potential === null ||
      String(values.potential).trim() === ''
    ) {
      errors.potential = 'Informe o potencial.';
    } else {
      const potNum = Number(values.potential);
      if (!Number.isInteger(potNum) || potNum < 1 || potNum > 99) {
        errors.potential = 'Use um valor de 1 a 99.';
      } else {
        validPotential = potNum;
      }
    }

    const validAttrs: number[] = [];
    for (const { key, emptyLabel, displayName } of attrKeys) {
      const rawVal = values[key];
      if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
        errors[key] = `Informe${emptyLabel}.`;
      } else {
        const num = Number(rawVal);
        if (!Number.isInteger(num) || num < 1 || num > 99) {
          errors[key] = 'Use um valor de 1 a 99.';
        } else {
          validAttrs.push(num);
          if (validPotential !== null && num > validPotential) {
            errors[key] =
              `${displayName} (${num}) acima do potencial (${validPotential}).`;
          }
        }
      }
    }

    if (validAttrs.length === 6 && validPotential !== null && !errors.potential) {
      const maxAttr = Math.max(...validAttrs);
      const sumAttrs = validAttrs.reduce((acc, v) => acc + v, 0);
      if (validAge !== null && validAge >= 33 && validPotential !== maxAttr) {
        errors.potential = `Com 33+ anos, deve ser igual ao maior atributo (${maxAttr}).`;
      } else if (sumAttrs > 480) {
        errors.potential = `Soma dos atributos (${sumAttrs}) passa de 480.`;
      }
    }
  }

  return errors;
}

export function validateConditionForm(values: {
  condition: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const validConditions: PlayerCondition[] = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'];
  if (
    !values.condition ||
    !validConditions.includes(values.condition as PlayerCondition)
  ) {
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

  const filled = values.slots.filter(
    (id): id is number => typeof id === 'number' && id > 0
  );
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
