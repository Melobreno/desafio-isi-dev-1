import React from 'react';
import type { FormationType } from '../../types/api';

export interface SoccerPitchSvgProps {
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Exact vector rendition of `frontend/src/assets/campo area.svg`
 * Aspect ratio: 1234 x 702 (approx 1.758:1)
 */
export const SoccerPitchSvg: React.FC<SoccerPitchSvgProps> = ({
  strokeColor = '#E4E4E7',
  strokeWidth = 1.5,
  fillColor = 'none',
  className,
  style,
}) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1234 702"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className={className}
      style={style}
    >
      {/* Outer Field Boundary */}
      <rect
        x="16.75"
        y="0.75"
        width="1200"
        height="700"
        rx="24"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Goal Net Left */}
      <rect
        x="0.75"
        y="310.75"
        width="16"
        height="80"
        rx="2"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Goal Net Right */}
      <rect
        x="1216.75"
        y="310.75"
        width="16"
        height="80"
        rx="2"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Penalty Area Left */}
      <rect
        x="16.75"
        y="175.75"
        width="170"
        height="350"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Penalty Area Right */}
      <rect
        x="1046.75"
        y="175.75"
        width="170"
        height="350"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Goal Area Left */}
      <rect
        x="16.75"
        y="270.75"
        width="60"
        height="160"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Goal Area Right */}
      <rect
        x="1156.75"
        y="270.75"
        width="60"
        height="160"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Halfway Line */}
      <rect x="615.75" y="0.75" width="1.5" height="700" fill={strokeColor} />
      {/* Center Circle */}
      <circle
        cx="616.75"
        cy="350.75"
        r="150"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Center Spot */}
      <circle cx="616.25" cy="350.25" r="3.5" fill={strokeColor} />
      {/* Penalty Spot Left */}
      <circle cx="131.75" cy="350.75" r="3" fill={strokeColor} />
      {/* Penalty Spot Right */}
      <circle cx="1101.75" cy="350.75" r="3" fill={strokeColor} />
      {/* Penalty Arc Left */}
      <path
        d="M186.75 278.252C197.938 286.739 207.009 297.7 213.255 310.278C219.5 322.855 222.75 336.707 222.75 350.75C222.75 364.793 219.5 378.645 213.255 391.222C207.009 403.8 197.938 414.761 186.75 423.248L185.843 422.053C196.847 413.706 205.769 402.925 211.911 390.555C218.054 378.185 221.25 364.561 221.25 350.75C221.25 336.939 218.054 323.315 211.911 310.945C205.769 298.575 196.847 287.794 185.843 279.447L186.75 278.252Z"
        fill={strokeColor}
      />
      {/* Penalty Arc Right */}
      <path
        d="M1046.75 423.248C1035.56 414.761 1026.49 403.8 1020.25 391.222C1014 378.645 1010.75 364.793 1010.75 350.75C1010.75 336.707 1014 322.855 1020.25 310.278C1026.49 297.7 1035.56 286.739 1046.75 278.252L1047.66 279.447C1036.65 287.794 1027.73 298.575 1021.59 310.945C1015.45 323.315 1012.25 336.939 1012.25 350.75C1012.25 364.561 1015.45 378.185 1021.59 390.555C1027.73 402.925 1036.65 413.706 1047.66 422.053L1046.75 423.248Z"
        fill={strokeColor}
      />
    </svg>
  );
};

export interface SoccerPitchProps {
  variant?: 'wireframe' | 'grass';
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const SoccerPitch: React.FC<SoccerPitchProps> = ({
  variant = 'wireframe',
  strokeColor,
  strokeWidth = 1.5,
  fillColor = 'none',
  className = '',
  style,
  children,
}) => {
  const isGrass = variant === 'grass';
  const computedStroke =
    strokeColor ?? (isGrass ? 'rgba(255, 255, 255, 0.42)' : '#E4E4E7');

  return (
    <div
      className={`soccer-pitch-container ${isGrass ? 'is-grass' : 'is-wireframe'} ${className}`.trim()}
      style={style}
    >
      {isGrass && <div className="soccer-pitch-stripes" />}
      <div className="soccer-pitch-svg-layer">
        <SoccerPitchSvg
          strokeColor={computedStroke}
          strokeWidth={strokeWidth}
          fillColor={fillColor}
        />
      </div>
      {children && <div className="soccer-pitch-content">{children}</div>}
    </div>
  );
};

// 5-player tactical coordinates per formation (percentage based: x, y)
// Representing a team playing towards the right on the soccer field
export const FORMATION_COORDINATES: Record<
  FormationType,
  Array<{ role: string; x: number; y: number }>
> = {
  '3-1': [
    { role: 'GOL', x: 6, y: 50 },
    { role: 'DEF', x: 20, y: 24 },
    { role: 'DEF', x: 20, y: 50 },
    { role: 'DEF', x: 20, y: 76 },
    { role: 'ATA', x: 40, y: 50 },
  ],
  '2-2': [
    { role: 'GOL', x: 6, y: 50 },
    { role: 'DEF', x: 20, y: 32 },
    { role: 'DEF', x: 20, y: 68 },
    { role: 'ATA', x: 38, y: 32 },
    { role: 'ATA', x: 38, y: 68 },
  ],
  '2-1-1': [
    { role: 'GOL', x: 6, y: 50 },
    { role: 'DEF', x: 19, y: 30 },
    { role: 'DEF', x: 19, y: 70 },
    { role: 'MEI', x: 30, y: 50 },
    { role: 'ATA', x: 41, y: 50 },
  ],
  '1-2-1': [
    { role: 'GOL', x: 6, y: 50 },
    { role: 'DEF', x: 18, y: 50 },
    { role: 'MEI', x: 29, y: 28 },
    { role: 'MEI', x: 29, y: 72 },
    { role: 'ATA', x: 41, y: 50 },
  ],
};

// Miniature green field card thumbnail for formation buttons
export interface FormationThumbnailProps {
  formation: FormationType;
  isActive?: boolean;
  className?: string;
}

export const FormationThumbnail: React.FC<FormationThumbnailProps> = ({
  formation,
  isActive = false,
  className = '',
}) => {
  const coords = FORMATION_COORDINATES[formation] || FORMATION_COORDINATES['2-1-1'];

  return (
    <div
      className={`formation-thumbnail-box ${isActive ? 'is-active' : ''} ${className}`.trim()}
      title={`Formação ${formation}`}
    >
      <div className="formation-thumbnail-stripes" />
      <div className="formation-thumbnail-svg-wrap">
        <SoccerPitchSvg
          strokeColor="rgba(255, 255, 255, 0.45)"
          strokeWidth={2}
          className="formation-thumbnail-svg"
        />
      </div>
      {coords.map((pt, i) => (
        <span
          key={i}
          className={`formation-dot ${pt.role === 'GOL' ? 'is-gol' : ''}`}
          style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
        />
      ))}
    </div>
  );
};
