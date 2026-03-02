import { useState } from 'react';
import {
    LayoutDashboard,
    Package,
    Layers,
    Settings,
    MessageSquare,
    ChevronRight,
    User,
    Shield,
    Menu,
    PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { cn } from '../../utils';
import { QuickDashboard } from './QuickDashboard';

export function AdminBar() {
    const { user, profile, company } = useAuth();
    const [isQuickDashOpen, setIsQuickDashOpen] = useState(false);

    if (!user) return null;

    const role = profile?.role || user?.user_metadata?.role;
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isStore = role === 'store' || role === 'vendor' || (!isAdmin && (role !== 'client' && role !== 'user') && company);
    const isClient = role === 'client' || role === 'user';

    if (!isAdmin && !isStore && !isClient) return null;

    return (
        <>
            <div className={cn(
                "w-full h-11 flex items-center justify-between px-4 z-[55] relative shadow-sm transition-all duration-300 border-b border-white/5",
                isAdmin ? "bg-slate-950 text-slate-100" :
                    isStore ? "bg-indigo-950 text-indigo-100" :
                        "bg-emerald-950 text-emerald-100"
            )}>
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
                    {/* Indicador de Rol */}
                    <div className="flex items-center gap-2 pr-3 border-r border-white/10 shrink-0">
                        {isAdmin ? <Shield size={16} className="text-amber-400" /> :
                            isStore ? <LayoutDashboard size={16} className="text-indigo-400" /> :
                                <User size={16} className="text-emerald-400" />}
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                            {isAdmin ? 'Modo Admin' : isStore ? 'Gestión Tienda' : 'Panel Cliente'}
                        </span>
                    </div>

                    {/* Accesos Rápidos */}
                    <nav className="flex items-center gap-1 sm:gap-4 shrink-0">
                        {isAdmin && (
                            <>
                                <Link to="/admin" className="text-[10px] font-black uppercase tracking-tight hover:text-white flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-white/10">
                                    <LayoutDashboard size={14} />
                                    <span className="hidden xs:inline">Escritorio</span>
                                </Link>
                                <Link to="/admin/usuarios" className="text-[10px] font-black uppercase tracking-tight hover:text-white flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-white/10">
                                    <User size={14} />
                                    <span className="hidden xs:inline">Usuarios</span>
                                </Link>
                            </>
                        )}

                        {isStore && (
                            <>
                                <Link to="/dashboard/productos" className="text-[10px] font-black uppercase tracking-tight hover:text-white flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-white/10">
                                    <Package size={14} />
                                    <span className="hidden xs:inline">Productos</span>
                                </Link>
                                <Link to="/dashboard/categorias" className="text-[10px] font-black uppercase tracking-tight hover:text-white flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-white/10">
                                    <Layers size={14} />
                                    <span className="hidden xs:inline">Categorías</span>
                                </Link>
                            </>
                        )}

                        {isClient && (
                            <>
                                <Link to="/dashboard/cliente/pedidos" className="text-[10px] font-black uppercase tracking-tight hover:text-white flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-white/10">
                                    <Package size={14} />
                                    <span className="hidden xs:inline">Mis Pedidos</span>
                                </Link>
                            </>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setIsQuickDashOpen(true)}
                        className="flex items-center gap-2 h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all group border border-white/5 active:scale-95"
                    >
                        <Menu size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden xs:block">Abrir Gestor</span>
                        <ChevronRight size={14} className="opacity-50 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

                    <Link
                        to={isAdmin ? '/admin' : isStore ? '/dashboard' : '/dashboard/cliente'}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors hidden sm:block text-white/70 hover:text-white"
                        title="Ir al Panel Completo"
                    >
                        <ExternalLink size={16} />
                    </Link>
                </div>
            </div>

            {/* Side Panel Drawer */}
            <QuickDashboard
                isOpen={isQuickDashOpen}
                onClose={() => setIsQuickDashOpen(false)}
            />
        </>
    );
}

// Helper icons that were missing in import but needed for clean look
function ExternalLink({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    );
}
