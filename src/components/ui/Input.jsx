import { cn } from '../../utils';

export function Input({ className, label, error, icon, showCounter, maxLength, value, ...props }) {
    const currentLength = value ? String(value).length : 0;

    return (
        <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between">
                {label && (
                    <label className="text-sm font-medium text-slate-700">
                        {label}
                    </label>
                )}
                {showCounter && maxLength && (
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border transition-all",
                        currentLength >= maxLength
                            ? "text-red-600 bg-red-50 border-red-100 animate-pulse"
                            : "text-slate-400 bg-slate-50 border-slate-100"
                    )}>
                        {currentLength} / {maxLength}
                    </span>
                )}
            </div>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-3 text-slate-400">
                        {icon}
                    </div>
                )}
                {props.type === 'textarea' ? (
                    <textarea
                        value={value}
                        maxLength={maxLength}
                        className={cn(
                            "flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-50 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                            icon && "pl-10",
                            error && "border-red-500 focus:ring-red-500",
                            className
                        )}
                        {...props}
                    />
                ) : (
                    <input
                        value={value}
                        maxLength={maxLength}
                        className={cn(
                            "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-50 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
                            icon && "pl-10",
                            error && "border-red-500 focus:ring-red-500",
                            className
                        )}
                        {...props}
                    />
                )}
            </div>
            {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
}
