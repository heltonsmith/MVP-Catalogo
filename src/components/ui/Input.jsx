import { cn } from '../../utils';

export function Input({ className, label, error, icon, ...props }) {
    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {icon}
                    </div>
                )}
                <input
                    className={cn(
                        "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
                        icon && "pl-10",
                        error && "border-red-500 focus:ring-red-500",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
}
