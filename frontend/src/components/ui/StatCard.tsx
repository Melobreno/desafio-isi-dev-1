import React from 'react';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  accentColor,
}) => {
  return (
    <div className="stat-card">
      <span className="stat-card-label">{label}</span>
      <span
        className="stat-card-value tabular-nums"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </span>
      {subValue && <span className="stat-card-sub">{subValue}</span>}
    </div>
  );
};
