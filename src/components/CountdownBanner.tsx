import { useState, useEffect } from 'react';

export const CountdownBanner = () => {
    // 15 minutos em segundos
    const [timeLeft, setTimeLeft] = useState(15 * 60);

    useEffect(() => {
        if (timeLeft <= 0) return;
        
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-[#007BFF] text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-black tracking-wide shadow-sm z-[100] relative">
            <span>⚡ Oferta Exclusiva! Expira em ⏰ {formatTime(timeLeft)}</span>
        </div>
    );
};
