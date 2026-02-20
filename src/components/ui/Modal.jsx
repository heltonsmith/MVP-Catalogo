import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils';

export function Modal({ isOpen, onClose, title, children, className, maxWidth = 'lg' }) {
    const maxWidthClasses = {
        'sm': 'max-w-sm',
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        'full': 'max-w-[95vw]'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-8 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={cn(
                                "w-full overflow-hidden rounded-[24px] sm:rounded-[32px] bg-white shadow-2xl pointer-events-auto flex flex-col max-h-[82vh] sm:max-h-[85vh]",
                                maxWidthClasses[maxWidth] || maxWidthClasses.lg,
                                "mx-auto ring-1 ring-slate-900/5",
                                className
                            )}
                        >
                            {title ? (
                                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h3>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[70] rounded-full bg-white/80 p-2 text-slate-400 shadow-sm backdrop-blur-md hover:bg-white hover:text-slate-600 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            )}
                            <div className="flex-1 overflow-y-auto pb-20 sm:pb-6">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
