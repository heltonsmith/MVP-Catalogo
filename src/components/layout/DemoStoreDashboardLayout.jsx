import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Settings,
    LogOut,
    Layers,
    MessageCircle,
    ExternalLink,
    Store,
    Lock,
    Info,
    Home
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils';
import { COMPANIES } from '../../data/mock';

export function DemoStoreDashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    // Use EcoVerde Spa (first company) for store demo
    const company = COMPANIES[0];

    const menuItems = [
        { name: 'Panel Principal', icon: <LayoutDashboard size={20} />, path: '/demo/tienda/dashboard' },
        { name: 'Mis Productos', icon: <Package size={20} />, path: '/demo/tienda/dashboard/productos' },
        { name: 'Categorías', icon: <Layers size={20} />, path: '/demo/tienda/dashboard/categorias' },
        { name: 'Cotizaciones', icon: <ExternalLink size={20} />, path: '/demo/tienda/dashboard/cotizaciones' },
        { name: 'Ajustes Perfil', icon: <Settings size={20} />, path: '/demo/tienda/dashboard/perfil' },
    ];

    return (
        <div className="flex h-screen w-full bg-slate-50 overscroll-none supports-[height:100dvh]:h-[100dvh]">
            {/* Sidebar for Desktop */}
            <aside className="hidden w-72 border-r border-slate-200 bg-white md:flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-primary-50/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 w-full">
                            <Info size={14} />
                            MODO DEMOSTRACIÓN
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden shadow-sm ring-1 ring-slate-200 shrink-0">
                            <img
                                src={company.logo}
                                alt={company.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-900 truncate">
                                {company.name}
                            </h2>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                Tienda Verificada
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/demo/tienda/dashboard'}
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
                                <span className="transition-colors group-hover:text-inherit">
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
                    <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 mb-4">
                        <p className="font-bold mb-1 text-slate-700">Nota:</p>
                        Esta es una versión de prueba. Los cambios no se guardarán.
                    </div>
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-primary-600 hover:text-primary-700 hover:bg-primary-50 font-bold"
                            onClick={() => navigate('/demo/catalogo/ecoverde-spa')}
                        >
                            <Store size={20} className="mr-3" />
                            Mi Catálogo Demo
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            onClick={() => navigate('/')}
                        >
                            <Home size={20} className="mr-3" />
                            Volver al Inicio
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-500 hover:text-slate-700"
                            onClick={() => navigate('/')}
                        >
                            <LogOut size={20} className="mr-3" />
                            Salir del Demo
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Mobile Header */}
                <header className="flex-none h-16 flex items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden z-30">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            DEMO
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                                src={company.logo}
                                alt={company.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <span className="font-bold text-slate-900 text-sm truncate max-w-[150px]">
                            {company.name}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <LogOut size={20} className="text-slate-500" />
                    </Button>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                    <div className="container mx-auto max-w-5xl">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="flex-none h-16 border-t border-slate-200 bg-white md:hidden grid grid-cols-5 z-50">
                    {menuItems.slice(0, 5).map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/demo/tienda/dashboard'}
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
