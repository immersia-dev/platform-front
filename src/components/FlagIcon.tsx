import { useId } from 'react';

import type { LocaleFlagCode } from '../i18n/translations';

type FlagIconProps = {
  code: LocaleFlagCode;
  className?: string;
};

function BrazilFlag() {
  return (
    <>
      <circle cx="32" cy="32" r="32" fill="#009b3a" />
      <path d="M32 12 56 32 32 52 8 32Z" fill="#ffdf00" />
      <circle cx="32" cy="32" r="12.5" fill="#002776" />
      <path
        d="M20 29.5c8.5-2.1 17.7-1.1 26.7 3.1"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </>
  );
}

function UnitedStatesFlag({ clipId }: { clipId: string }) {
  const stripes = Array.from({ length: 13 }, (_, index) => (
    <rect
      key={index}
      x="0"
      y={(64 / 13) * index}
      width="64"
      height={64 / 13}
      fill={index % 2 === 0 ? '#b22234' : '#ffffff'}
    />
  ));

  const stars = Array.from({ length: 20 }, (_, index) => {
    const row = Math.floor(index / 5);
    const column = index % 5;

    return (
      <circle
        key={index}
        cx={5 + column * 6}
        cy={5 + row * 5}
        r="1.1"
        fill="#ffffff"
      />
    );
  });

  return (
    <g clipPath={`url(#${clipId})`}>
      {stripes}
      <rect x="0" y="0" width="30" height="34.5" fill="#3c3b6e" />
      {stars}
    </g>
  );
}

function SpainFlag({ clipId }: { clipId: string }) {
  return (
    <g clipPath={`url(#${clipId})`}>
      <rect width="64" height="64" fill="#aa151b" />
      <rect y="17" width="64" height="30" fill="#f1bf00" />
      <rect x="18" y="25" width="8" height="12" rx="1.5" fill="#c60b1e" />
      <rect x="20" y="23" width="4" height="3" rx="1" fill="#f1bf00" />
    </g>
  );
}

export default function FlagIcon({ code, className = 'h-5 w-5' }: FlagIconProps) {
  const clipId = useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
      data-i18n-skip="true"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>

      {code === 'br' ? <BrazilFlag /> : null}
      {code === 'us' ? <UnitedStatesFlag clipId={clipId} /> : null}
      {code === 'es' ? <SpainFlag clipId={clipId} /> : null}
    </svg>
  );
}
