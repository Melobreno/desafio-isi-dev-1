import React, { useCallback, useRef, useState } from 'react';
import {
  ChevronDown,
  Coins,
  HeartPulse,
  Info,
  Search,
  Shield,
  Shirt,
  User,
  X,
} from 'lucide-react';
import type { PlayerCondition, PlayerPosition } from '../../types/api';
import type { PlayerFilterState } from '../../hooks/usePlayerFilters';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useLeagueSummary } from '../../context/LeagueSummaryContext';
import {
  CONDITION_LABELS,
  POSITION_LABELS,
  formatCurrency,
} from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type PopoverId = 'position' | 'condition' | 'club' | 'age' | 'value';

const POSITIONS: PlayerPosition[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'];
const CONDITIONS: PlayerCondition[] = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'];

interface FilterPillProps {
  icon: React.ReactNode;
  label: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const FilterPill: React.FC<FilterPillProps> = ({
  icon,
  label,
  active,
  disabled,
  onClick,
}) => (
  <button
    type="button"
    disabled={disabled}
    className={`filter-pill-btn${active ? ' active' : ''}`}
    onClick={onClick}
  >
    <span className="filter-pill-icon">{icon}</span>
    <span>{label}</span>
    <ChevronDown size={13} className="filter-pill-chevron" />
  </button>
);

interface ChoiceFilterProps<V extends string | number> {
  icon: React.ReactNode;
  label: string;
  allLabel: string;
  value: V | '';
  options: Array<{ value: V; content: React.ReactNode }>;
  onSelect: (value: V | '') => void;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Tooltip shown on hover while the filter is disabled. */
  disabledHint?: string;
  wrapperClassName?: string;
}

/** Single-choice filter pill with a dropdown ("all" option plus one per value). */
function ChoiceFilter<V extends string | number>({
  icon,
  label,
  allLabel,
  value,
  options,
  onSelect,
  isOpen,
  onToggle,
  disabled,
  disabledHint,
  wrapperClassName = '',
}: ChoiceFilterProps<V>) {
  return (
    <div className={`filter-popover-anchor ${wrapperClassName}`.trim()}>
      <FilterPill
        icon={icon}
        label={label}
        active={value !== ''}
        disabled={disabled}
        onClick={onToggle}
      />

      {disabled && disabledHint && (
        <div className="club-disabled-tooltip" role="tooltip">
          <Info size={12} />
          <span>{disabledHint}</span>
        </div>
      )}

      {isOpen && !disabled && (
        <div className="filter-dropdown-panel">
          <button
            type="button"
            className={`filter-dropdown-option${value === '' ? ' selected' : ''}`}
            onClick={() => onSelect('')}
          >
            {allLabel}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-dropdown-option${value === option.value ? ' selected' : ''}`}
              onClick={() => onSelect(option.value)}
            >
              {option.content}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface RangeFilterProps {
  id: string;
  icon: React.ReactNode;
  pillLabel: string;
  active: boolean;
  title: string;
  minLabel: string;
  maxLabel: string;
  minPlaceholder: string;
  maxPlaceholder: string;
  inputMode: 'numeric' | 'decimal';
  min: string;
  max: string;
  onChange: (range: { min: string; max: string }) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/** Min/max range filter pill with a popover (age and market value). */
const RangeFilter: React.FC<RangeFilterProps> = ({
  id,
  icon,
  pillLabel,
  active,
  title,
  minLabel,
  maxLabel,
  minPlaceholder,
  maxPlaceholder,
  inputMode,
  min,
  max,
  onChange,
  isOpen,
  onToggle,
  onClose,
}) => (
  <div className="filter-popover-anchor">
    <FilterPill
      icon={icon}
      label={<span className="tabular-nums">{pillLabel}</span>}
      active={active}
      onClick={onToggle}
    />

    {isOpen && (
      <div className="filter-range-popover">
        <div className="filter-range-title">{title}</div>
        <div className="form-grid-2">
          <div>
            <label className="form-label" htmlFor={`${id}-min`}>
              {minLabel}
            </label>
            <Input
              id={`${id}-min`}
              type="text"
              inputMode={inputMode}
              placeholder={minPlaceholder}
              value={min}
              onChange={(e) => onChange({ min: e.target.value, max })}
            />
          </div>
          <div>
            <label className="form-label" htmlFor={`${id}-max`}>
              {maxLabel}
            </label>
            <Input
              id={`${id}-max`}
              type="text"
              inputMode={inputMode}
              placeholder={maxPlaceholder}
              value={max}
              onChange={(e) => onChange({ min, max: e.target.value })}
            />
          </div>
        </div>
        <div className="filter-range-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange({ min: '', max: '' });
              onClose();
            }}
          >
            Limpar
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Concluir
          </Button>
        </div>
      </div>
    )}
  </div>
);

const ActiveChip: React.FC<{
  label: React.ReactNode;
  removeLabel: string;
  onRemove: () => void;
  tabular?: boolean;
}> = ({ label, removeLabel, onRemove, tabular }) => (
  <span className={`active-filter-chip${tabular ? ' tabular-nums' : ''}`}>
    <span>{label}</span>
    <button type="button" onClick={onRemove} aria-label={removeLabel}>
      <X size={12} />
    </button>
  </span>
);

interface PlayersFilterBarProps {
  filters: PlayerFilterState;
}

/** Search box, filter pills and active filter chips of the players list (J01–J04). */
export const PlayersFilterBar: React.FC<PlayersFilterBarProps> = ({ filters }) => {
  const { clubs, clubsMap } = useLeagueSummary();
  const {
    criteria,
    updateCriteria,
    appliedSearch,
    ageFilterActive,
    valueFilterActive,
    hasNonTabFilters,
  } = filters;
  const {
    position,
    condition,
    clubId,
    minAge,
    maxAge,
    minValue,
    maxValue,
    availabilityTab,
  } = criteria;

  const [openPopover, setOpenPopover] = useState<PopoverId | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const closePopover = useCallback(() => setOpenPopover(null), []);
  useClickOutside(wrapperRef, closePopover, openPopover !== null);

  const toggle = (id: PopoverId) => setOpenPopover((prev) => (prev === id ? null : id));
  const choose = (patch: Parameters<typeof updateCriteria>[0]) => {
    updateCriteria(patch);
    closePopover();
  };

  const selectedClub = clubId !== '' ? clubsMap[Number(clubId)] : undefined;
  const ageLabel = `${minAge || '16'} a ${maxAge || '45'}`;
  const valueLabel = `${minValue ? formatCurrency(Number(minValue)) : '0,00'} a ${
    maxValue ? formatCurrency(Number(maxValue)) : '550,00'
  }`;
  const onlySearchActive =
    Boolean(appliedSearch) &&
    !position &&
    !condition &&
    clubId === '' &&
    !ageFilterActive &&
    !valueFilterActive;

  return (
    <div className="filter-section-wrapper" ref={wrapperRef}>
      <div className="filter-bar-card">
        <div className="filter-search-box">
          <Input
            leftIcon={<Search size={14} />}
            placeholder="Buscar por nome"
            value={filters.searchInput}
            onChange={(e) => filters.setSearchInput(e.target.value)}
            aria-label="Buscar jogador por nome"
          />
        </div>

        <ChoiceFilter
          icon={<Shirt size={14} />}
          label={position ? `Posição: ${POSITION_LABELS[position]}` : 'Posição'}
          allLabel="Todas as posições"
          value={position}
          options={POSITIONS.map((pos) => ({
            value: pos,
            content: (
              <>
                <span className="filter-option-code">{pos}</span>
                <span>{POSITION_LABELS[pos]}</span>
              </>
            ),
          }))}
          onSelect={(value) => choose({ position: value })}
          isOpen={openPopover === 'position'}
          onToggle={() => toggle('position')}
        />

        <ChoiceFilter
          icon={<HeartPulse size={14} />}
          label={condition ? `Condição: ${CONDITION_LABELS[condition]}` : 'Condição'}
          allLabel="Todas as condições"
          value={condition}
          options={CONDITIONS.map((cond) => ({
            value: cond,
            content: CONDITION_LABELS[cond],
          }))}
          onSelect={(value) => choose({ condition: value })}
          isOpen={openPopover === 'condition'}
          onToggle={() => toggle('condition')}
        />

        <ChoiceFilter
          icon={<Shield size={14} />}
          label={selectedClub ? `Clube: ${selectedClub.name}` : 'Clube'}
          allLabel="Todos os clubes"
          value={clubId}
          options={clubs.map((club) => ({
            value: club.id,
            content: (
              <>
                <span className="club-acronym-pill">{club.acronym}</span>
                <span>{club.name}</span>
              </>
            ),
          }))}
          onSelect={(value) => choose({ clubId: value })}
          isOpen={openPopover === 'club'}
          onToggle={() => toggle('club')}
          disabled={availabilityTab === 'FREE'}
          disabledHint="“Livres” não combina com o filtro por clube."
          wrapperClassName="club-filter-wrapper"
        />

        <RangeFilter
          id="filter-age"
          icon={<User size={14} />}
          pillLabel={ageFilterActive ? `Idade: ${ageLabel}` : 'Idade'}
          active={ageFilterActive}
          title="Faixa de idade (16 a 45 anos)"
          minLabel="Mínima"
          maxLabel="Máxima"
          minPlaceholder="16"
          maxPlaceholder="45"
          inputMode="numeric"
          min={minAge}
          max={maxAge}
          onChange={({ min, max }) => updateCriteria({ minAge: min, maxAge: max })}
          isOpen={openPopover === 'age'}
          onToggle={() => toggle('age')}
          onClose={closePopover}
        />

        <RangeFilter
          id="filter-value"
          icon={<Coins size={14} />}
          pillLabel={valueFilterActive ? `Valor: ${valueLabel}` : 'Valor de mercado'}
          active={valueFilterActive}
          title="Faixa de valor de mercado (0 a 550 moedas)"
          minLabel="Mínimo"
          maxLabel="Máximo"
          minPlaceholder="0,00"
          maxPlaceholder="550,00"
          inputMode="decimal"
          min={minValue}
          max={maxValue}
          onChange={({ min, max }) => updateCriteria({ minValue: min, maxValue: max })}
          isOpen={openPopover === 'value'}
          onToggle={() => toggle('value')}
          onClose={closePopover}
        />
      </div>

      {hasNonTabFilters && (
        <div className="active-filters-row">
          <span className="active-filters-label">
            {onlySearchActive ? 'Resultados para a busca:' : 'Filtros ativos:'}
          </span>

          {appliedSearch && (
            <ActiveChip
              label={`Busca: ${appliedSearch}`}
              removeLabel="Remover busca"
              onRemove={filters.clearSearch}
            />
          )}
          {position && (
            <ActiveChip
              label={`Posição: ${POSITION_LABELS[position]}`}
              removeLabel="Remover filtro de posição"
              onRemove={() => updateCriteria({ position: '' })}
            />
          )}
          {condition && (
            <ActiveChip
              label={`Condição: ${CONDITION_LABELS[condition]}`}
              removeLabel="Remover filtro de condição"
              onRemove={() => updateCriteria({ condition: '' })}
            />
          )}
          {clubId !== '' && (
            <ActiveChip
              label={`Clube: ${selectedClub?.name ?? `#${clubId}`}`}
              removeLabel="Remover filtro de clube"
              onRemove={() => updateCriteria({ clubId: '' })}
            />
          )}
          {ageFilterActive && (
            <ActiveChip
              tabular
              label={`Idade: ${ageLabel}`}
              removeLabel="Remover filtro de idade"
              onRemove={() => updateCriteria({ minAge: '', maxAge: '' })}
            />
          )}
          {valueFilterActive && (
            <ActiveChip
              tabular
              label={`Valor de mercado: ${valueLabel}`}
              removeLabel="Remover filtro de valor"
              onRemove={() => updateCriteria({ minValue: '', maxValue: '' })}
            />
          )}

          <button type="button" className="clear-filters-link" onClick={filters.clearAll}>
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
};
