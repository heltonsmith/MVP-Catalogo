import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
    LayoutDashboard,
    Package,
    Settings,
    LogOut,
    Layers,
    ExternalLink,
    ChevronRight,
    Store,
    Lock,
    Home
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';
import { TooltipCard } from '../ui/Tooltip';

import { NotificationCenter } from '../notifications/NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';
import { SEO } from '../layout/SEO';

export function DashboardLayout() {
    const navigate = useNavigate();
    const { user, profile, company, loading, signOut, unreadNotifications: globalUnread } = useAuth();
    const { unreadSystemCount } = useNotifications();

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

    return (
        <div className="flex h-full w-full bg-slate-50 overscroll-none">
            <SEO title="Panel de Control" noindex={true} />
            {/* Sidebar for Desktop */}
            <aside className="hidden w-72 border-r border-slate-200 bg-white md:flex flex-col">
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
                    {menuItems.map((item) => {
                        const isLocked = company?.plan === 'free' && ['Cotizaciones'].includes(item.name);

                        const getTooltipContent = (name) => {
                            if (name === 'Cotizaciones') {
                                return {
                                    title: '📋 Cotizaciones',
                                    description: 'Registra todas las cotizaciones de clientes ordenadas por fecha. Filtra, marca como respondidas o completadas, y visualiza detalles completos de cada solicitud.'
                                };
                            }
                            return null;
                        };

                        const navLink = (
                            <NavLink
                                key={item.path}
                                to={isLocked ? '#' : item.path}
                                end={item.path === '/dashboard'}
                                onClick={(e) => {
                                    if (isLocked) {
                                        e.preventDefault();
                                    }
                                }}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
                                        isActive && !isLocked
                                            ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                                        isLocked && "opacity-70 cursor-not-allowed"
                                    )
                                }
                            >
                                <div className="flex items-center space-x-3">
                                    <span className={cn(
                                        "transition-colors",
                                        "group-hover:text-inherit",
                                        isLocked && "text-slate-400"
                                    )}>
                                        {item.icon}
                                    </span>
                                    <span>{item.name}</span>
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

                        if (isLocked) {
                            const tooltipContent = getTooltipContent(item.name);
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

                        return navLink;
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-2">
                    <NavLink to="/">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        >
                            <Home size={20} className="mr-3" />
                            Volver al Inicio
                        </Button>
                    </NavLink>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} className="mr-3" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden relative">

                {/* Mobile Header */}
                <header className="flex-none h-16 flex items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden z-30">
                    <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center overflow-hidden shrink-0">
                            {company?.logo ? (
                                <img
                                    src={company.logo}
                                    alt={company.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Store className="h-5 w-5 text-primary-600" />
                            )}
                        </div>
                        <span className="font-bold text-slate-900 text-sm truncate max-w-[150px]">
                            {profile?.role === 'admin' || profile?.role === 'super_admin'
                                ? 'Admin Ktaloog'
                                : (profile?.role === 'client' || profile?.role === 'user')
                                    ? (profile?.full_name || user?.user_metadata?.full_name || 'Mi Perfil')
                                    : (company?.name || 'Mi Tienda')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <NavLink to="/">
                            <Button variant="ghost" size="icon">
                                <Home size={20} className="text-slate-500" />
                            </Button>
                        </NavLink>
                        <Button variant="ghost" size="icon" onClick={handleLogout}>
                            <LogOut size={20} className="text-red-500" />
                        </Button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="container mx-auto max-w-5xl">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation - FIXED */}
                <nav className="flex-none h-16 border-t border-slate-200 bg-white md:hidden grid grid-cols-5 z-50">
                    {menuItems.slice(0, 5).map((item) => {
                        const isLocked = company?.plan === 'free' && ['Cotizaciones'].includes(item.name);
                        return (
                            <NavLink
                                key={item.path}
                                to={isLocked ? '#' : item.path}
                                end={item.path === '/dashboard'}
                                onClick={(e) => {
                                    if (isLocked) e.preventDefault();
                                }}
                                className={({ isActive }) =>
                                    cn(
                                        "flex flex-col items-center justify-center text-[10px] font-bold transition-colors relative",
                                        isActive && !isLocked ? "text-primary-600" : "text-slate-400 hover:text-slate-600",
                                        isLocked && "opacity-60"
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className="relative">
                                            {item.icon}
                                            {isLocked ? (
                                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-slate-200 flex items-center justify-center ring-2 ring-white">
                                                    <Lock size={6} className="text-slate-500" />
                                                </div>
                                            ) : item.badge && (
                                                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                                            )}
                                        </div>
                                        <span className="mt-1 text-[9px]">{item.name.split(' ')[0]}</span>

                                        {isActive && !isLocked && (
                                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-500" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>
            </div >
        </div >
    );
}
