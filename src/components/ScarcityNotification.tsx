import React, { useEffect, useState } from 'react';

// Lista de nomes e apelidos típicos de Moçambique (amostra)
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
  'Malu',
  'Kito',
  'Dado',
  'Titi',
  'Goma',
];

/**
 * Exibe uma notificação breve a cada 2 minutos indicando que um utilizador aleatório
 * acabou de concluir o pagamento. A notificação aparece no topo da página de checkout
 * e desaparece automaticamente após alguns segundos.
 */
export const ScarcityNotification = () => {
  const [displayName, setDisplayName] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const showNotification = () => {
      const name = MOZ_NICKNAMES[Math.floor(Math.random() * MOZ_NICKNAMES.length)];
      const nickname = MOZ_NICKNAMES[Math.floor(Math.random() * MOZ_NICKNAMES.length)];
      setDisplayName(`${name} ${nickname}`);
      setVisible(true);
      // Esconder após 8 segundos
      setTimeout(() => setVisible(false), 8000);
    };
    // Exibir imediatamente ao montar
    showNotification();
    // Repetir a cada 1 minuto (60000 ms)
    const interval = setInterval(showNotification, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
      <div className="fixed top-28 left-4 bg-black/70 text-white px-3 py-1 rounded-full border border-gray-600 shadow-md z-[102] flex items-center gap-2 text-xs animate-fade-in">
        🎉 {displayName} acabou de finalizar o pagamento!
      </div>
  );
};
