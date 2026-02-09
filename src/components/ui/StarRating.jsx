import { Star, StarHalf } from 'lucide-react';
import { cn } from '../../utils';

export function StarRating({ rating, count, size = 16, className, onClick }) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div
            className={cn(
                "flex items-center gap-2 transition-all",
                onClick && "cursor-pointer hover:scale-105 active:scale-95",
                className
            )}
            onClick={onClick}
        >
            <div className="flex items-center gap-0.5">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} size={size} className="fill-yellow-400 text-yellow-400" />
                ))}
                {hasHalfStar && <StarHalf size={size} className="fill-yellow-400 text-yellow-400" />}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star key={`empty-${i}`} size={size} className="text-slate-200" />
                ))}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-full shadow-lg ring-1 ring-white/10">
                <span className="text-xs font-black text-white">{rating}</span>
                {count !== undefined && (
                    <span className="text-[10px] font-bold text-slate-300 border-l border-white/20 pl-1.5 ml-0.5 tracking-tight">
                        {count} {count === 1 ? 'opinión' : 'opiniones'}
                    </span>
                )}
            </div>
        </div>
    );
}
