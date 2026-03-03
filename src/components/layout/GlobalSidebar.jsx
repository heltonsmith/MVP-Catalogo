import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Settings,
    LogOut,
    Layers,
    ExternalLink,
    Store,
    Users,
    Search,
    Shield,
    Inbox,
    Home,
    Heart,
    ShoppingBag,
    MessageSquare,
    User,
    Megaphone,
    Globe
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';
import { useNotifications } from '../../hooks/useNotifications';
import { TooltipCard } from '../ui/Tooltip';

export function GlobalSidebar({ isOpen, onClose }) {
    const location = useLocation();
    const { user, profile, company, signOut } = useAuth();
    const { unreadSystemCount, unreadTicketsCount } = useNotifications();

    if (!user) return null;

    const role = profile?.role || user?.user_metadata?.role;
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isStore = role === 'store' || role === 'vendor' || (!isAdmin && (role !== 'client' && role !== 'user') && company);
    const isClient = role === 'client' || role === 'user';
    const isPublic = !isAdmin && !isStore && !isClient;

    const publicItems = [
        { name: 'Inicio', path: '/', icon: <Home size={20} />, end: true },
        { name: 'Buscador Tiendas', path: '/explorar', icon: <Search size={20} /> },
    ];

    // Determinar qué menú mostrar
    let menuItems = [];
    if (isAdmin) {
        menuItems = [
            { name: 'Resumen', path: '/admin', icon: <LayoutDashboard size={20} />, end: true },
            { name: 'Ir al Inbox', path: '/inbox', icon: <Inbox size={20} /> },
            { name: 'Difusión', path: '/admin/difusion', icon: <Megaphone size={20} /> },
            { name: 'Explorador', path: '/admin/explorador', icon: <Search size={20} /> },
            { name: 'Usuarios & Tiendas', path: '/admin/usuarios', icon: <Users size={20} /> },
            {
                name: 'Tickets',
                path: '/admin/tickets',
                icon: <MessageSquare size={20} />,
                badge: unreadTicketsCount > 0 ? unreadTicketsCount : null
            },
            { name: 'Controles', path: '/admin/controles', icon: <Settings size={20} /> },
            { name: 'Configuración', path: '/admin/configuracion', icon: <Globe size={20} /> },
        ];
    } else if (isStore) {
        menuItems = [
            { name: 'Panel Principal', path: '/dashboard', icon: <LayoutDashboard size={20} />, end: true },
            { name: 'Ir al Inbox', path: '/inbox', icon: <Inbox size={20} /> },
            { name: 'Difusión', path: '/dashboard/difusion', icon: <Megaphone size={20} /> },
            { name: 'Categorías', path: '/dashboard/categorias', icon: <Layers size={20} /> },
            { name: 'Mis Productos', path: '/dashboard/productos', icon: <Package size={20} /> },
            { name: 'Cotizaciones', path: '/dashboard/cotizaciones', icon: <ExternalLink size={20} />, lockedIfFree: true },
            { name: 'Ajustes Perfil', path: '/dashboard/perfil', icon: <Settings size={20} />, badge: unreadSystemCount > 0 ? unreadSystemCount : null },
            { name: 'Ver Catálogo', path: `/catalogo/${company?.slug}`, icon: <Store size={20} /> },
        ];
    } else if (isClient) {
        menuItems = [
            { name: 'Mi Panel', path: '/dashboard/cliente', icon: <LayoutDashboard size={20} />, end: true },
            { name: 'Ir al Inbox', path: '/inbox', icon: <Inbox size={20} /> },
            { name: 'Favoritos', path: '/dashboard/cliente/favoritos', icon: <Heart size={20} /> },
            { name: 'Cotizaciones', path: '/dashboard/cliente/cotizaciones', icon: <ShoppingBag size={20} /> },
            { name: 'Mi Perfil', path: '/dashboard/cliente/perfil', icon: <Settings size={20} /> },
        ];
    }

    const renderNavItem = (item) => {
        const isLocked = isStore && item.lockedIfFree && company?.plan === 'free';

        const navLink = (
            <NavLink
                key={item.path}
                to={isLocked ? '#' : item.path}
                end={item.end}
                onClick={(e) => {
                    if (isLocked) e.preventDefault();
                    if (window.innerWidth < 768) onClose();
                }}
                className={({ isActive }) =>
                    cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all group",
                        isActive && !isLocked
                            ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                        isLocked && "opacity-70 cursor-not-allowed"
                    )
                }
            >
                <div className="flex items-center gap-3">
                    <span className="transition-colors group-hover:text-inherit">
                        {item.icon}
                    </span>
                    <span className="flex-1 text-sm">{item.name}</span>
                </div>
                {item.badge && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {item.badge}
                    </span>
                )}
            </NavLink>
        );

        if (isLocked) {
            return (
                <TooltipCard
                    key={item.path}
                    side="right"
                    title={`🔒 ${item.name}`}
                    description="Disponible en planes superiores."
                >
                    {navLink}
                </TooltipCard>
            );
        }

        return navLink;
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                style={{ top: 'calc(4rem + var(--observer-banner-height, 0px))' }}
                className={cn(
                    "w-72 bg-white border-r border-slate-200 fixed bottom-0 hidden md:flex flex-col z-40 transition-all duration-300",
                )}
            >
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden shadow-sm ring-1 ring-slate-200 shrink-0">
                            {isStore && company?.logo ? (
                                <img src={company.logo} alt="" className="h-full w-full object-cover" />
                            ) : profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : isAdmin ? (
                                <Shield className="h-6 w-6 text-primary-600" />
                            ) : (
                                <User className="h-6 w-6 text-primary-600" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-900 truncate">
                                {isAdmin ? 'Admin Ktaloog' : isStore ? company?.name : profile?.full_name || 'Mi Cuenta'}
                            </h2>
                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">
                                {isAdmin ? 'Super Editor' : isStore ? 'Tienda Verificada' : 'Cliente Premium'}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
                    {menuItems.map(renderNavItem)}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-3 text-sm font-bold"
                        onClick={signOut}
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Mobile Menu Drawer (same logic but using isOpen) */}
            <aside
                style={{ top: 'var(--observer-banner-height, 0px)' }}
                className={cn(
                    "fixed inset-y-0 left-0 w-72 bg-white z-[110] md:hidden transform transition-transform duration-300 ease-in-out border-r border-slate-200 flex flex-col pt-4 shadow-2xl",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-4 border-b border-slate-100 flex items-center space-x-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden shadow-sm ring-1 ring-slate-200 shrink-0">
                        {isStore && company?.logo ? (
                            <img src={company.logo} alt="" className="h-full w-full object-cover" />
                        ) : profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : isAdmin ? (
                            <Shield className="h-6 w-6 text-primary-600" />
                        ) : (
                            <User className="h-6 w-6 text-primary-600" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-slate-900 truncate">
                            {isAdmin ? 'Admin Ktaloog' : isStore ? company?.name : profile?.full_name || 'Mi Cuenta'}
                        </h2>
                        <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">
                            {isAdmin ? 'Super Editor' : isStore ? 'Tienda Verificada' : 'Cliente Premium'}
                        </p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {publicItems.map(renderNavItem)}
                    <div className="my-4 border-t border-slate-100 mx-2" />
                    {menuItems.map(renderNavItem)}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-3 text-sm font-bold h-12"
                        onClick={signOut}
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] md:hidden"
                    onClick={onClose}
                />
            )}
        </>
    );
}
