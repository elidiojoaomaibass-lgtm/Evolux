import { useState, useEffect } from 'react';

export const CountdownBanner = ({ barColor }: { barColor?: string }) => {
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
        <div 
            className="w-full bg-[#007BFF] text-white px-4 flex items-center justify-center gap-2 text-base md:text-lg font-black tracking-wide shadow-sm z-[100] relative"
            style={{
                backgroundColor: barColor || '#007BFF',
                paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
                paddingBottom: '0.75rem'
            }}
        >
            <span style={{ color: (barColor?.toLowerCase() === '#ffffff') ? '#FFFFFF' : undefined }}>⚡ Oferta Exclusiva! Expira em ⏰ {formatTime(timeLeft)}</span>
        </div>
    );
};
