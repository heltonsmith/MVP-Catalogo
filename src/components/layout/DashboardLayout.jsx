import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Settings,
    LogOut,
    Layers,
    ExternalLink,
    Store,
    Lock,
    Home,
    Menu,
    X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';
import { TooltipCard } from '../ui/Tooltip';

import { NotificationCenter } from '../notifications/NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';
import { SEO } from '../layout/SEO';

export function DashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile, company, loading, signOut, unreadNotifications: globalUnread } = useAuth();
    const { unreadSystemCount } = useNotifications();

    // Auto-close mobile menu on navigation
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            } else {
                const role = profile?.role || user?.user_metadata?.role;
                if (role === 'admin') {
                    navigate('/admin');
                } else if (role === 'client' || role === 'user') {
                    navigate('/dashboard/cliente');
                }
            }
        }
    }, [user, profile, loading, navigate]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const menuItems = [
        { name: 'Panel Principal', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Mis Productos', icon: <Package size={20} />, path: '/dashboard/productos' },
        { name: 'Categorías', icon: <Layers size={20} />, path: '/dashboard/categorias' },
        { name: 'Cotizaciones', icon: <ExternalLink size={20} />, path: '/dashboard/cotizaciones' },
        {
            name: 'Ajustes Perfil',
            icon: <Settings size={20} />,
            path: '/dashboard/perfil',
            badge: unreadSystemCount > 0 ? unreadSystemCount : null
        },
    ];

    const renderNavItem = (item, isMobile = false) => {
        const isLocked = company?.plan === 'free' && ['Cotizaciones'].includes(item.name);

        const navLink = (
            <NavLink
                key={item.path}
                to={isLocked ? '#' : item.path}
                end={item.path === '/dashboard'}
                onClick={(e) => {
                    if (isLocked) e.preventDefault();
                }}
                className={({ isActive }) =>
                    cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all group",
                        isMobile ? "text-base" : "text-sm",
                        isActive && !isLocked
                            ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                        isLocked && "opacity-70 cursor-not-allowed"
                    )
                }
            >
                <div className="flex items-center gap-3">
                    <span className={cn(
                        "transition-colors",
                        "group-hover:text-inherit",
                        isLocked && "text-slate-400"
                    )}>
                        {item.icon}
                    </span>
                    <span className="flex-1">{item.name}</span>
                </div>
                {isLocked ? (
                    <div className="bg-slate-100 p-1 rounded-lg">
                        <Lock size={12} className="text-slate-400" />
                    </div>
                ) : item.badge && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {item.badge}
                    </span>
                )}
            </NavLink>
        );

        if (isLocked && !isMobile) {
            const tooltipContent = item.name === 'Cotizaciones'
                ? { title: '📋 Cotizaciones', description: 'Registra todas las cotizaciones de clientes ordenadas por fecha. Filtra, marca como respondidas o completadas, y visualiza detalles completos de cada solicitud.' }
                : null;

            if (tooltipContent) {
                return (
                    <TooltipCard
                        key={item.path}
                        title={tooltipContent.title}
                        description={tooltipContent.description}
                        side="right"
                    >
                        {navLink}
                    </TooltipCard>
                );
            }
        }

        return navLink;
    };

    return (
        <div className="h-full bg-slate-50 flex overflow-x-hidden relative">
            <SEO title="Panel de Control" noindex={true} />

            {/* Desktop Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 fixed h-full hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden shadow-sm ring-1 ring-slate-200 shrink-0">
                            {company?.logo ? (
                                <img
                                    src={company.logo}
                                    alt={company.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Store className="h-6 w-6 text-primary-600" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-900 truncate">
                                {profile?.role === 'admin' || profile?.role === 'super_admin'
                                    ? 'Admin Ktaloog'
                                    : (profile?.role === 'client' || profile?.role === 'user')
                                        ? (profile?.full_name || user?.user_metadata?.full_name || 'Mi Perfil')
                                        : (company?.name || 'Mi Tienda')}
                            </h2>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                {company ? 'Tienda Verificada' : 'Configurando...'}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => renderNavItem(item, false))}
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-2">
                    <NavLink to="/">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-50 gap-3"
                        >
                            <Home size={20} />
                            Volver al Inicio
                        </Button>
                    </NavLink>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-3"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full h-16 bg-white z-50 px-4 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 -ml-2 text-slate-500 hover:text-primary-600 transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center overflow-hidden shrink-0">
                            {company?.logo ? (
                                <img src={company.logo} alt={company.name} className="h-full w-full object-cover" />
                            ) : (
                                <Store className="h-5 w-5 text-primary-600" />
                            )}
                        </div>
                        <span className="font-bold text-slate-900 text-sm truncate max-w-[150px]">
                            {company?.name || 'Mi Tienda'}
                        </span>
                    </div>
                </div>
                <NavLink to="/">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary-600 h-9 w-9">
                        <Home size={20} />
                    </Button>
                </NavLink>
            </header>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[55] md:hidden backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu Drawer */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-72 bg-white z-[60] md:hidden transform transition-transform duration-300 ease-in-out border-r border-slate-200 flex flex-col pt-16",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden shadow-md shrink-0">
                            {company?.logo ? (
                                <img src={company.logo} alt={company.name} className="h-full w-full object-cover" />
                            ) : (
                                <Store className="h-6 w-6 text-primary-600" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-900 truncate">
                                {company?.name || 'Mi Tienda'}
                            </h2>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                {company ? 'Tienda Verificada' : 'Configurando...'}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => renderNavItem(item, true))}
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-2 mb-4">
                    <NavLink to="/">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-50 gap-3 h-12"
                        >
                            <Home size={20} />
                            Volver al Inicio
                        </Button>
                    </NavLink>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-3 h-12"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-72 p-4 md:p-8 pt-20 md:pt-8 min-w-0">
                <div className="w-full max-w-5xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
