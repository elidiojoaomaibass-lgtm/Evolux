
import { cn } from "../lib/utils";

interface LogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
    textColor?: string;
}

export const Logo = ({ className, size = 40, showText = false, textColor = "text-violet-950" }: LogoProps) => {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div
                style={{ width: size, height: size }}
                className="relative flex shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-violet-500/30"
            >
                <img
                    src="/logo.png"
                    alt="Evolux Prod Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback: SVG gradient logo if image not found
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                            parent.style.background = 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)';
                            parent.innerHTML = `
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70%;height:70%;color:white;drop-shadow:0 2px 4px rgba(0,0,0,0.3)">
                                    <path d="M4 6H16M4 12H12M4 18H16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M14 15L19 10M19 10L16 10M19 10L19 13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            `;
                        }
                    }}
                />
            </div>
            {showText && (
                <span className={cn("text-xl md:text-2xl font-black tracking-tight leading-none", textColor)}>
                    Evolux <span className="text-violet-600 dark:text-violet-400">Prod</span>
                </span>
            )}
        </div>
    );
};
