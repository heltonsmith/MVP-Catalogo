import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils';
import { Zap, Info } from 'lucide-react';

export function Tooltip({ children, content }) {
    const [isVisible, setIsVisible] = useState(false);
    const triggerRef = useRef(null);
    const [coords, setCoords] = useState(null);

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + rect.height / 2,
                left: rect.left + rect.width
            });
        }
    };

    return (
        <div
            ref={triggerRef}
            className="inline-block"
            onMouseEnter={() => {
                updateCoords();
                setIsVisible(true);
            }}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && coords && createPortal(
                <div
                    className="fixed z-[999999] px-3 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg shadow-xl pointer-events-none"
                    style={{
                        top: `${coords.top}px`,
                        left: `${coords.left + 10}px`,
                        transform: 'translateY(-50%)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {content}
                    <div className="absolute w-2 h-2 bg-slate-900 rotate-45 -left-1 top-1/2 -translate-y-1/2" />
                </div>,
                document.body
            )}
        </div>
    );
}

export function TooltipCard({ children, title, description, side = 'left' }) {
    const [isVisible, setIsVisible] = useState(false);
    const triggerRef = useRef(null);
    const [coords, setCoords] = useState(null);

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            if (side === 'left') {
                setCoords({
                    top: rect.top,
                    left: rect.left - 300 // 288px (w-72) + 12px margin
                });
            } else {
                setCoords({
                    top: rect.top,
                    left: rect.left + rect.width + 12
                });
            }
        }
    };

    return (
        <div
            ref={triggerRef}
            className="w-full"
            onMouseEnter={() => {
                updateCoords();
                setIsVisible(true);
            }}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && coords && createPortal(
                <div
                    className="fixed z-[999999] w-72 p-4 bg-white border-2 border-slate-900 rounded-xl shadow-2xl pointer-events-none"
                    style={{
                        top: `${coords.top}px`,
                        left: `${coords.left}px`
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={16} className="text-amber-500 fill-amber-500" />
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        {description}
                    </p>

                    {side === 'left' ? (
                        <div className="absolute w-4 h-4 bg-white border-r-2 border-b-2 border-slate-900 rotate-45 -right-[10px] top-6" />
                    ) : (
                        <div className="absolute w-4 h-4 bg-white border-l-2 border-t-2 border-slate-900 rotate-45 -left-[10px] top-6" />
                    )}

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-amber-600 uppercase">Premium</span>
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                            <Info size={10} />
                            Mejorar para activar
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
