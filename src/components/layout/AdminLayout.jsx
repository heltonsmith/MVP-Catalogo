import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils';

export function AdminLayout() {
    const location = useLocation();

    const navigation = [
        { name: 'Resumen', href: '/admin', icon: LayoutDashboard },
        { name: 'Usuarios & Tiendas', href: '/admin/usuarios', icon: Users },
        { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
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
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Link to="/login">
                        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 gap-3">
                            <LogOut size={18} />
                            Cerrar Sesión
                        </Button>
                    </Link>
                </div>
            </aside>

            {/* Mobile Header (visible only on small screens) */}
            <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 p-4 flex items-center justify-between">
                <span className="font-bold">Admin Panel</span>
                {/* Mobile menu toggle would go here */}
            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8 pt-20 md:pt-8">
                <Outlet />
            </main>
        </div>
    );
}
