import { useEffect, useRef } from 'react';
import { Eye, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export function ObserverBanner() {
    const { isObserving, observerData, company, profile, stopObserving } = useAuth();
    const bannerRef = useRef(null);

    useEffect(() => {
        if (isObserving && bannerRef.current) {
            const height = bannerRef.current.offsetHeight;
            document.documentElement.style.setProperty('--observer-banner-height', `${height}px`);
        } else {
            document.documentElement.style.setProperty('--observer-banner-height', '0px');
        }
    }, [isObserving]);

    if (!isObserving) return null;

    return (
        <div
            ref={bannerRef}
            className="bg-amber-600 text-white py-1.5 px-4 flex items-center justify-between sticky top-0 z-[100] shadow-md animate-in slide-in-from-top duration-300 h-auto sm:h-12"
        >
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex h-8 w-8 rounded-full bg-amber-500 items-center justify-center shrink-0">
                    <Eye size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider opacity-90 leading-tight">Observador Activo</p>
                    <p className="text-xs sm:text-sm font-black truncate max-w-[120px] sm:max-w-none">
                        <span className="hidden sm:inline">Viendo como: </span>
                        <span className="underline decoration-1 underline-offset-2">{company?.name || profile?.full_name || 'Cargando...'}</span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden lg:block text-right">
                    <p className="text-[9px] uppercase font-bold opacity-75">Admin Ktaloog</p>
                </div>
                <Button
                    onClick={stopObserving}
                    variant="white"
                    size="sm"
                    className="h-8 px-3 gap-1.5 font-black text-amber-700 hover:bg-amber-50 text-[10px] sm:text-xs"
                >
                    <LogOut size={14} />
                    <span className="hidden sm:inline">SALIR DEL MODO</span>
                    <span className="sm:hidden">SALIR</span>
                </Button>
            </div>
        </div>
    );
}
