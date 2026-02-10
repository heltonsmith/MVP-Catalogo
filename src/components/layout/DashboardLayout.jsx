import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Settings,
    LogOut,
    Layers,
    MessageCircle,
    ExternalLink,
    ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { COMPANIES } from '../../data/mock';
import { cn } from '../../utils';

export function DashboardLayout() {
    const navigate = useNavigate();

    const company = COMPANIES[0]; // Default for demo

    const menuItems = [
        { name: 'Panel Principal', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Mis Productos', icon: <Package size={20} />, path: '/dashboard/productos' },
        { name: 'Categorías', icon: <Layers size={20} />, path: '/dashboard/categorias' },
        { name: 'Mensajes', icon: <MessageCircle size={20} />, path: '/dashboard/mensajes', badge: '3' },
        { name: 'Cotizaciones', icon: <ExternalLink size={20} />, path: '/dashboard/cotizaciones' },
        { name: 'Ajustes Perfil', icon: <Settings size={20} />, path: '/dashboard/perfil' },
    ];

    return (
        <div className="flex h-screen w-full bg-slate-50 overscroll-none supports-[height:100dvh]:h-[100dvh]">
            {/* Sidebar for Desktop */}
            <aside className="hidden w-72 border-r border-slate-200 bg-white md:flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                        <img
                            src={company.logo}
                            alt={company.name}
                            className="h-10 w-10 rounded-xl object-cover shadow-sm ring-1 ring-slate-200"
                        />
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-900 truncate">{company.name}</h2>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Tienda Verificada</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
                                    isActive
                                        ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )
                            }
                        >
                            <div className="flex items-center space-x-3">
                                <span className={cn(
                                    "transition-colors",
                                    "group-hover:text-inherit"
                                )}>
                                    {item.icon}
                                </span>
                                <span>{item.name}</span>
                            </div>
                            {item.badge && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => navigate('/')}
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
                        <img
                            src={company.logo}
                            alt={company.name}
                            className="h-8 w-8 rounded-lg object-cover"
                        />
                        <span className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{company.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <LogOut size={20} className="text-red-500" />
                    </Button>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                    <div className="container mx-auto max-w-5xl">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation - FIXED */}
                <nav className="flex-none h-16 border-t border-slate-200 bg-white md:hidden grid grid-cols-5 z-50">
                    {menuItems.slice(0, 5).map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) =>
                                cn(
                                    "flex flex-col items-center justify-center text-[10px] font-bold transition-colors relative",
                                    isActive ? "text-primary-600" : "text-slate-400 hover:text-slate-600"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="relative">
                                        {item.icon}
                                        {item.badge && (
                                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                                        )}
                                    </div>
                                    <span className="mt-1 text-[9px]">{item.name.split(' ')[0]}</span>

                                    {isActive && (
                                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-500" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    );
}
