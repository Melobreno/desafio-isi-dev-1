import React from 'react';
import { Coins, Landmark, Shirt, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface ClubKpiGridProps {
  cash: number;
  squadValue: number;
  netWorth: number;
  squadSize: number;
}

const MAX_SQUAD_SIZE = 12;

export const ClubKpiGrid: React.FC<ClubKpiGridProps> = ({
  cash,
  squadValue,
  netWorth,
  squadSize,
}) => (
  <div className="club-kpi-grid">
    <KpiCard label="Caixa" icon={<Wallet size={14} />} value={formatCurrency(cash)} />
    <KpiCard
      label="Valor do elenco"
      icon={<Coins size={14} />}
      value={formatCurrency(squadValue)}
    />
    <KpiCard
      label="Patrimônio"
      icon={<Landmark size={14} />}
      value={formatCurrency(netWorth)}
    />
    <KpiCard
      label="Elenco"
      icon={<Shirt size={14} />}
      value={
        <>
          {squadSize} <span className="club-kpi-subvalue">de {MAX_SQUAD_SIZE}</span>
        </>
      }
    />
  </div>
);

const KpiCard: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
}> = ({ label, icon, value }) => (
  <div className="club-kpi-card">
    <div className="club-kpi-top">
      <span className="club-kpi-label">{label}</span>
      <span className="club-kpi-icon">{icon}</span>
    </div>
    <div className="club-kpi-value tabular-nums">{value}</div>
  </div>
);
