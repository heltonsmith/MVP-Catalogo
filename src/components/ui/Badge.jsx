import { cn } from '../../utils';

export function Badge({ className, variant = 'default', children, ...props }) {
    const variants = {
        default: 'bg-slate-100 text-slate-800',
        primary: 'bg-primary-100 text-primary-800',
        success: 'bg-emerald-100 text-emerald-800',
        error: 'bg-red-100 text-red-800',
        destructive: 'bg-red-600 text-white shadow-sm', // High contrast for image overlays
        outline: 'border border-slate-200 text-slate-600',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
