import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { cn } from '../../utils';

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = '¿Estás seguro?',
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    loading = false
}) {
    const variants = {
        danger: {
            iconBg: 'bg-rose-50',
            iconColor: 'text-rose-500',
            button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100',
        },
        warning: {
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100',
        },
        primary: {
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            button: 'bg-primary-600 hover:bg-primary-700 shadow-primary-100',
        }
    };

    const currentVariant = variants[variant] || variants.danger;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={null}
            maxWidth="sm"
            className="!rounded-[2.5rem]"
        >
            <div className="p-8 sm:p-10 flex flex-col items-center text-center">
                <div className={cn(
                    "h-20 w-20 rounded-3xl flex items-center justify-center mb-6 animate-in zoom-in-50 duration-300",
                    currentVariant.iconBg,
                    currentVariant.iconColor
                )}>
                    <AlertTriangle size={40} />
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight px-4 leading-tight">
                    {title}
                </h3>

                {description && (
                    <p className="text-slate-500 text-sm leading-relaxed mb-10 px-8">
                        {description}
                    </p>
                )}

                <div className="flex flex-col gap-3 w-full mt-6">
                    <Button
                        onClick={onConfirm}
                        loading={loading}
                        className={cn(
                            "h-14 rounded-2xl text-white font-bold shadow-lg transition-all active:scale-95 w-full",
                            currentVariant.button
                        )}
                    >
                        {confirmText}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="h-14 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95 w-full"
                    >
                        {cancelText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
