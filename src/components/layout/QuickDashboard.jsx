import { useState, useEffect } from 'react';
import {
    X,
    LayoutDashboard,
    Package,
    Layers,
    Settings,
    MessageSquare,
    Store,
    TrendingUp,
    ChevronRight,
    Loader2,
    Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../utils';
import { Button } from '../ui/Button';

export function QuickDashboard({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { profile, company, user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset' };
    }, [isOpen]);

    if (!isOpen) return null;

    const role = profile?.role || user?.user_metadata?.role;
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isStore = role === 'store' || role === 'vendor' || (!isAdmin && (role !== 'client' && role !== 'user') && company);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Side Panel */}
            <aside className={cn(
                "fixed inset-y-0 right-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col transform transition-transform duration-500 ease-out",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-200">
                            <LayoutDashboard size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 leading-tight">Acceso Rápido</h2>
                            <p className="text-[11px] font-bold text-primary-600 uppercase tracking-widest">
                                {isAdmin ? 'Administración' : isStore ? 'Gestión Tienda' : 'Panel Cliente'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-900 transition-all shadow-sm border border-transparent hover:border-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {/* Unified Actions */}
                    <section>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Acciones Críticas</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Link to={isAdmin ? "/admin" : (isStore ? "/dashboard" : "/dashboard/cliente")} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 hover:bg-primary-50 transition-all group">
                                <TrendingUp className="text-slate-400 group-hover:text-primary-600 mb-2" size={24} />
                                <span className="text-xs font-bold text-slate-600">Ver Stats</span>
                            </Link>
                            <Link to={isStore ? "/dashboard/productos" : isAdmin ? "/admin/usuarios" : "/dashboard/cliente/pedidos"} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 hover:bg-primary-50 transition-all group">
                                <Package className="text-slate-400 group-hover:text-primary-600 mb-2" size={24} />
                                <span className="text-xs font-bold text-slate-600">{isStore ? 'Productos' : isAdmin ? 'Usuarios' : 'Pedidos'}</span>
                            </Link>
                        </div>
                    </section>

                    {/* Quick Menu */}
                    <nav className="space-y-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Navegación</h3>

                        {[
                            { name: 'Ir al Panel Completo', path: isAdmin ? '/admin' : isStore ? '/dashboard' : '/dashboard/cliente', icon: <LayoutDashboard size={18} /> },
                            { name: isStore ? 'Mis Categorías' : isAdmin ? 'Explorador' : 'Favoritos', path: isStore ? '/dashboard/categorias' : isAdmin ? '/admin/explorador' : '/dashboard/cliente/favoritos', icon: <Layers size={18} /> },
                            { name: 'Mensajes e Inbox', path: '/inbox', icon: <MessageSquare size={18} /> },
                            { name: 'Ajustes de Perfil', path: isAdmin ? '/admin/configuracion' : isStore ? '/dashboard/perfil' : '/dashboard/cliente/perfil', icon: <Settings size={18} /> },
                        ].map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400 group-hover:text-primary-600 transition-colors">{item.icon}</span>
                                    <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">{item.name}</span>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </nav>

                    {/* Info Card */}
                    {isStore && company && (
                        <div className="p-5 rounded-2xl bg-indigo-900 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield size={14} className="text-indigo-300" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Tienda Verificada</span>
                                </div>
                                <h4 className="font-bold text-lg mb-1">{company.name}</h4>
                                <p className="text-xs text-indigo-100/70 mb-4 truncate">{company.description || 'Sin descripción'}</p>
                                <Button
                                    variant="white"
                                    size="sm"
                                    className="w-full text-indigo-900 font-bold h-9"
                                    onClick={() => {
                                        navigate(`/catalogo/${company.slug}`);
                                        onClose();
                                    }}
                                >
                                    <Store size={14} className="mr-2" />
                                    Ver Público
                                </Button>
                            </div>
                            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight">
                        Sistema Catalogo MVP • Versión 1.2
                    </p>
                </div>
            </aside>
        </>
    );
}
