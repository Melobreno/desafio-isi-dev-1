import {
  validateBuyPlayerForm,
  validateClubForm,
  validateConditionForm,
  validatePlayerForm,
} from './validators';

const validPlayer = {
  name: 'Meia Zeta',
  position: 'MEI',
  agility: 70,
  age: 25,
  pace: 60,
  shooting: 60,
  passing: 60,
  dribbling: 60,
  defending: 60,
  physical: 60,
  potential: 80,
};

describe('validatePlayerForm', () => {
  it('aceita um cadastro válido', () => {
    expect(validatePlayerForm(validPlayer)).toEqual({});
  });

  it('exige nome com duas palavras e sem números', () => {
    expect(validatePlayerForm({ ...validPlayer, name: '' }).name).toBe('Informe o nome.');
    expect(validatePlayerForm({ ...validPlayer, name: 'Zeta' }).name).toBe(
      'Informe pelo menos duas palavras.'
    );
    expect(validatePlayerForm({ ...validPlayer, name: 'Zeta 10' }).name).toBe(
      'O nome não pode conter números.'
    );
  });

  it('valida as faixas de idade e agilidade', () => {
    expect(validatePlayerForm({ ...validPlayer, age: 15 }).age).toBeDefined();
    expect(validatePlayerForm({ ...validPlayer, age: 46 }).age).toBeDefined();
    expect(validatePlayerForm({ ...validPlayer, agility: 0 }).agility).toBeDefined();
    expect(validatePlayerForm({ ...validPlayer, agility: 101 }).agility).toBeDefined();
  });

  it('limita a agilidade a 85 para 35 anos ou mais', () => {
    const errors = validatePlayerForm({ ...validPlayer, age: 35, agility: 90 });
    expect(errors.agility).toBe('Máximo 85 para 35 anos ou mais.');
  });

  it('recusa atributo acima do potencial e soma acima de 480', () => {
    expect(validatePlayerForm({ ...validPlayer, pace: 90 }).pace).toContain(
      'acima do potencial'
    );
    const sum = validatePlayerForm({
      ...validPlayer,
      pace: 90,
      shooting: 90,
      passing: 90,
      dribbling: 90,
      defending: 90,
      physical: 90,
      potential: 99,
    });
    expect(sum.potential).toContain('passa de 480');
  });

  it('impede a idade de diminuir na edição', () => {
    const errors = validatePlayerForm({
      ...validPlayer,
      age: 20,
      isEdit: true,
      currentAge: 25,
    });
    expect(errors.age).toBe('A idade não pode diminuir (atual: 25).');
  });
});

describe('validateClubForm', () => {
  it('aceita nome e sigla válidos', () => {
    expect(validateClubForm({ name: 'Águias do Sul', acronym: 'AGS' })).toEqual({});
  });

  it('exige nome de 3 a 60 caracteres e sigla com 3 letras', () => {
    expect(validateClubForm({ name: '', acronym: '' })).toEqual({
      name: 'Informe o nome do clube.',
      acronym: 'Informe a sigla do clube.',
    });
    expect(validateClubForm({ name: 'ab', acronym: 'AB' })).toMatchObject({
      name: expect.any(String),
      acronym: 'A sigla deve conter exatamente 3 letras.',
    });
    expect(validateClubForm({ name: 'a'.repeat(61), acronym: 'AAA' }).name).toBeDefined();
  });
});

describe('validateBuyPlayerForm', () => {
  it('exige clube e data de fidelidade', () => {
    expect(validateBuyPlayerForm({ clubId: '', loyaltyUntil: '' })).toEqual({
      clubId: 'Selecione o clube comprador.',
      loyaltyUntil: 'Informe a data e hora de fim da fidelidade.',
    });
  });

  it('aceita dados completos', () => {
    expect(
      validateBuyPlayerForm({ clubId: '2', loyaltyUntil: '2027-01-01T10:00' })
    ).toEqual({});
  });
});

describe('validateConditionForm', () => {
  it('aceita apenas condições conhecidas', () => {
    expect(validateConditionForm({ condition: 'APTO' })).toEqual({});
    expect(validateConditionForm({ condition: 'apto' }).condition).toBeDefined();
  });
});
