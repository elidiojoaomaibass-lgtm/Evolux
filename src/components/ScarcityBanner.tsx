import React, { useEffect, useState } from 'react';

// List of Mozambican nicknames (common informal names)
const MOZ_NICKNAMES = [
  'Mussa',
  'Jabu',
  'Bubi',
  'Xico',
  'Nani',
  'Tuto',
  'Zaza',
  'Lulu',
  'Fafa',
  'Mimi',
];

/**
 * ScarcityBanner props
 * @param stockRemaining Number of items remaining (optional)
 * @param nickname Optional nickname to display (randomly chosen if not provided)
 */
export const ScarcityBanner = ({
  stockRemaining = Math.max(1, Math.floor(Math.random() * 5) + 1),
  nickname,
}: {
  stockRemaining?: number;
  nickname?: string;
}) => {
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    // Choose a random nickname if none provided
    const name = nickname || MOZ_NICKNAMES[Math.floor(Math.random() * MOZ_NICKNAMES.length)];
    setDisplayName(name);
  }, [nickname]);

  return (
    <div
      className="w-full bg-[#ff4d4d] text-white px-4 py-2 flex items-center justify-center gap-2 text-base md:text-lg font-black tracking-wide shadow-sm z-[101] relative animate-pulse"
    >
      ⚡ Oferta Exclusiva! Apenas <span className="underline">{stockRemaining}</span> unidade{stockRemaining > 1 ? 's' : ''} restante{stockRemaining > 1 ? 's' : ''}.
      <span className="ml-2">Cliente <strong>{displayName}</strong> acabou de finalizar o pagamento!</span>
    </div>
  );
};
