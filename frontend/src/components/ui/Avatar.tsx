import React from 'react';
import { getAvatarPaletteIndex, getInitials } from '../../utils/formatters';

interface AvatarProps {
  name: string;
  seed?: string | number;
  size?: number;
}

const PALETTES = [
  { bg: 'var(--avatar-violet-bg)', text: 'var(--avatar-violet-text)' },
  { bg: 'var(--avatar-pink-bg)', text: 'var(--avatar-pink-text)' },
  { bg: 'var(--avatar-cyan-bg)', text: 'var(--avatar-cyan-text)' },
  { bg: 'var(--avatar-teal-bg)', text: 'var(--avatar-teal-text)' },
  { bg: 'var(--avatar-zinc-bg)', text: 'var(--avatar-zinc-text)' },
];

export const Avatar: React.FC<AvatarProps> = ({ name, seed, size = 28 }) => {
  const paletteIdx = getAvatarPaletteIndex(seed ?? name);
  const palette = PALETTES[paletteIdx] ?? PALETTES[0];
  const initials = getInitials(name);

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: palette.bg,
        color: palette.text,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(10, Math.round(size * 0.39)),
        fontWeight: 600,
        flexShrink: 0,
        userSelect: 'none',
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
};
