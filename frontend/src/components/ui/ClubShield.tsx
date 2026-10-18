import React from 'react';
import { Shield } from 'lucide-react';
import { getAvatarPaletteIndex } from '../../utils/formatters';

interface ClubShieldProps {
  name: string;
  clubId?: number | null;
  size?: number;
  showName?: boolean;
}

const SHIELD_COLORS = ['#155dfc', '#00813a', '#7e22ce', '#be185d', '#b55200'];

export const ClubShield: React.FC<ClubShieldProps> = ({
  name,
  clubId,
  size = 16,
  showName = true,
}) => {
  const colorIdx = getAvatarPaletteIndex(clubId ?? name);
  const color = SHIELD_COLORS[colorIdx] ?? SHIELD_COLORS[0];

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Shield
        size={size}
        style={{ color, fill: `${color}18`, flexShrink: 0 }}
        aria-hidden="true"
      />
      {showName && (
        <span
          style={{
            fontSize: 13,
            color: 'var(--foreground)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </span>
      )}
    </span>
  );
};
