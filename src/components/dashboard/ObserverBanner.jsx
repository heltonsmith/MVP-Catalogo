import { Eye, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export function ObserverBanner() {
    const { isObserving, observerData, company, profile, stopObserving } = useAuth();

    if (!isObserving) return null;

    return (
        <div className="bg-amber-600 text-white py-2 px-4 flex items-center justify-between sticky top-0 z-[60] shadow-md animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
                    <Eye size={18} className="text-white" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-90">Modo Observador Activo</p>
                    <p className="text-sm font-black">
                        Viendo como: <span className="underline decoration-2 underline-offset-2">{company?.name || profile?.full_name || 'Cargando...'}</span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                    <p className="text-[10px] uppercase font-bold opacity-75">Sesión de Administrador</p>
                    <p className="text-xs font-bold">Admin Ktaloog</p>
                </div>
                <Button
                    onClick={stopObserving}
                    variant="white"
                    size="sm"
                    className="gap-2 font-black text-amber-700 hover:bg-amber-50"
                >
                    <LogOut size={16} />
                    SALIR DEL MODO OBSERVADOR
                </Button>
            </div>
        </div>
    );
}
