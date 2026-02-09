import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Settings,
    LogOut,
    Layers,
    ExternalLink,
    ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils';

export function DashboardLayout() {
    const navigate = useNavigate();

    const menuItems = [
        { name: 'Panel Principal', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Mis Productos', icon: <Package size={20} />, path: '/dashboard/productos' },
        { name: 'Categorías', icon: <Layers size={20} />, path: '/dashboard/categorias' },
        { name: 'Ajustes Perfil', icon: <Settings size={20} />, path: '/dashboard/perfil' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar for Desktop */}
            <aside className="hidden w-72 border-r border-slate-200 bg-white md:flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-xl text-slate-900">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600"></div>
                        <span>Admin</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                                    isActive
                                        ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )
                            }
                        >
                            <div className="flex items-center space-x-3">
                                {item.icon}
                                <span>{item.name}</span>
                            </div>
                            {/* <ChevronRight size={16} className="opacity-0" /> */}
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
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
                    <div className="flex items-center space-x-2 font-bold text-slate-900">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600"></div>
                        <span>Admin</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <LogOut size={20} className="text-red-500" />
                    </Button>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="container mx-auto max-w-5xl">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="sticky bottom-0 z-40 flex h-16 border-t border-slate-200 bg-white md:hidden">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) =>
                                cn(
                                    "flex flex-1 flex-col items-center justify-center text-[10px] font-bold",
                                    isActive ? "text-primary-600" : "text-slate-400"
                                )
                            }
                        >
                            {item.icon}
                            <span className="mt-1">{item.name.split(' ')[0]}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    );
}
