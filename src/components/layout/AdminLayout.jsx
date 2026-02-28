import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Settings, Search, Home, MessageSquare, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';
import { useNotifications } from '../../hooks/useNotifications';

import { NotificationCenter } from '../notifications/NotificationCenter';

export function AdminLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, profile, loading, signOut } = useAuth();
    const { unreadTicketsCount } = useNotifications();

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            } else if (profile?.role !== 'admin') {
                navigate('/dashboard');
            }
        }
    }, [user, profile, loading, navigate]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (loading) return null;
    if (!profile || profile.role !== 'admin') return null;

    const navigation = [
        { name: 'Resumen', href: '/admin', icon: LayoutDashboard },
        { name: 'Explorador', href: '/admin/explorador', icon: Search },
        { name: 'Usuarios & Tiendas', href: '/admin/usuarios', icon: Users },
        { name: 'Sistema de Tickets', href: '/admin/tickets', icon: MessageSquare },
        { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
    ];

    return (
        <div className="h-full bg-slate-50 flex overflow-x-hidden relative">
                        {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white fixed h-full hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xl font-bold">
                        <span className="text-primary-400">Admin</span>Panel
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary-600 text-white"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                )}
                            >
                                <item.icon size={18} />
                                <span className="flex-1">{item.name}</span>
                                {item.name === 'Sistema de Tickets' && unreadTicketsCount > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900">
                                        {unreadTicketsCount > 9 ? '9+' : unreadTicketsCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-2">
                    <Link to="/">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 gap-3"
                        >
                            <Home size={18} />
                            Volver al Inicio
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 gap-3"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>


            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full h-16 bg-slate-900 text-white z-50 px-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="font-bold tracking-tight">Admin<span className="text-primary-400">Panel</span></span>
                    </div>
                </div>
                {/* Bell removed as per request */}
                <Link to="/">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-9 w-9">
                        <Home size={20} />
                    </Button>
                </Link>
            </header>

            {/* Mobile Sidebar Overlay */}
            {
                isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-[55] md:hidden backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )
            }

            {/* Mobile Menu Drawer */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-72 bg-slate-900 text-white z-[60] md:hidden transform transition-transform duration-300 ease-in-out border-r border-slate-800 flex flex-col pt-16",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <nav className="flex-1 p-4 space-y-2">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                                    isActive
                                        ? "bg-primary-600 text-white shadow-lg shadow-primary-900/20"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                )}
                            >
                                <item.icon size={20} />
                                <span className="flex-1">{item.name}</span>
                                {item.name === 'Sistema de Tickets' && unreadTicketsCount > 0 && (
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white shadow-md ring-2 ring-slate-900">
                                        {unreadTicketsCount > 9 ? '9+' : unreadTicketsCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-2 mb-4">
                    <Link to="/">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 gap-3 h-12"
                        >
                            <Home size={20} />
                            Volver al Inicio
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 gap-3 h-12"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 min-w-0">
                <div className="w-full max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </main>

        </div >
    );
}
