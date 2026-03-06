
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}: ConfirmationModalProps) => {

    const variantStyles = {
        danger: {
            icon: <AlertTriangle className="text-red-500" size={32} />,
            bgIcon: "bg-red-50 dark:bg-red-900/20",
            button: "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/25",
            border: "border-red-100 dark:border-red-900/30"
        },
        warning: {
            icon: <AlertTriangle className="text-amber-500" size={32} />,
            bgIcon: "bg-amber-50 dark:bg-amber-900/20",
            button: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/25",
            border: "border-amber-100 dark:border-amber-900/30"
        },
        info: {
            icon: <AlertTriangle className="text-violet-500" size={32} />,
            bgIcon: "bg-violet-50 dark:bg-violet-900/20",
            button: "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-violet-500/25",
            border: "border-violet-100 dark:border-violet-900/30"
        }
    };

    const currentVariant = variantStyles[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={cn(
                            "relative w-full max-w-md bg-white dark:bg-brand-900 rounded-[2.5rem] shadow-2xl p-8 border",
                            currentVariant.border
                        )}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-brand-800 flex items-center justify-center text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            {/* Icon Container */}
                            <div className={cn(
                                "h-20 w-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm",
                                currentVariant.bgIcon
                            )}>
                                {currentVariant.icon}
                            </div>

                            {/* Text Content */}
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
                                {title}
                            </h3>
                            <p className="text-sm text-slate-400 dark:text-brand-400 font-medium px-4">
                                {description}
                            </p>

                            {/* Buttons */}
                            <div className="mt-10 flex flex-col w-full gap-3">
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={cn(
                                        "w-full py-4 rounded-2xl text-white text-sm font-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]",
                                        currentVariant.button
                                    )}
                                >
                                    {confirmText}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 rounded-2xl bg-slate-50 dark:bg-brand-800 text-slate-500 dark:text-brand-300 text-sm font-black hover:bg-slate-100 dark:hover:bg-brand-700 transition-all active:scale-[0.98]"
                                >
                                    {cancelText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
