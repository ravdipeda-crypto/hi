// Small, dependency-free line icons drawn as inline SVG. We intentionally
// avoid pictographic Unicode glyphs (△ ◇ ⚙ etc.) for navigation and
// wordmark accents — font glyph coverage for those varies across browsers
// and platforms and can silently render as empty boxes. Plain stroked SVG
// paths render identically everywhere and fit the "technical line-art"
// blueprint aesthetic better than emoji-style symbols.

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  'aria-hidden': true,
};

export function TriangleMark(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 L21 20 L3 20 Z" />
      <path d="M12 3 L12 20 M7.5 12 L16.5 12" strokeWidth={1} opacity={0.6} />
    </svg>
  );
}

export function TodayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="5" width="16" height="15" rx="0" />
      <path d="M4 10 H20 M8 3 V6 M16 3 V6" />
    </svg>
  );
}

export function CommitmentsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4" width="17" height="16" />
      <path d="M3.5 9 H20.5 M8 4 V9" />
    </svg>
  );
}

export function ProgressIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12 L12 5.5 A6.5 6.5 0 0 1 18 12 Z" fill="currentColor" stroke="none" opacity={0.8} />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21 M5.6 5.6 L7.7 7.7 M16.3 16.3 L18.4 18.4 M5.6 18.4 L7.7 16.3 M16.3 7.7 L18.4 5.6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12.5 L9.5 18 L20 5" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 5 L19 19 M19 5 L5 19" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19 12 H5 M11 6 L5 12 L11 18" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 5 L19 12 L7 19 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 5 V19 M16 5 V19" strokeWidth={2.4} strokeLinecap="butt" />
    </svg>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="6" y="6" width="12" height="12" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12 H19 M13 6 L19 12 L13 18" />
    </svg>
  );
}
