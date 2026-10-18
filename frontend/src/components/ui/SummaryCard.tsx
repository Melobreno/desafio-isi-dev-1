import React from 'react';

export type SummaryTone = 'default' | 'success' | 'destructive';

interface SummaryRowProps {
  label: React.ReactNode;
  children: React.ReactNode;
  /** Bold row with a subtle background (totals such as "Custo total"). */
  highlight?: boolean;
  tone?: SummaryTone;
  /** Applies tabular numerals; disable when `children` is not a number (badges). */
  numeric?: boolean;
}

export const SummaryRow: React.FC<SummaryRowProps> = ({
  label,
  children,
  highlight = false,
  tone = 'default',
  numeric = true,
}) => (
  <div className={`receipt-summary-row${highlight ? ' is-highlight' : ''}`}>
    <span className={`receipt-summary-label${highlight ? ' is-bold' : ''}`}>{label}</span>
    <span
      className={[
        'receipt-summary-value',
        highlight ? 'is-bold' : '',
        numeric ? 'tabular-nums' : '',
        tone !== 'default' ? `tone-${tone}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  </div>
);

/** Bordered card that groups label/value rows (purchase, sale and contract summaries). */
export const SummaryCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="receipt-summary-card">{children}</div>
);

/** Maps a signed number to the success/destructive tone used for profit and cash change. */
export function toneFromSign(value: number | null | undefined): SummaryTone {
  if (!value) return 'default';
  return value > 0 ? 'success' : 'destructive';
}
