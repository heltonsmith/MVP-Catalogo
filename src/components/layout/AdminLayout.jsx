import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LayoutDashboard, Users, LogOut, Settings, Search, Home } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';

export function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, profile, loading, signOut } = useAuth();

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
        { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-x-hidden relative">
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
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary-900/50 flex items-center justify-center border border-primary-500/20">
                        <LayoutDashboard size={18} className="text-primary-400" />
                    </div>
                    <span className="font-bold tracking-tight">Admin<span className="text-primary-400">Panel</span></span>
                </div>
                <div className="flex items-center gap-1">
                    <Link to="/">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-9 w-9">
                            <Home size={20} />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400 h-9 w-9" onClick={handleLogout}>
                        <LogOut size={20} />
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 pb-24 md:pt-8 md:pb-8 min-w-0">
                <div className="w-full max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 w-full h-16 bg-slate-900 border-t border-slate-800 md:hidden grid grid-cols-4 z-50">
                {navigation.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.href === '/admin'}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center text-[10px] font-bold transition-colors",
                                isActive ? "text-primary-400" : "text-slate-500 hover:text-white"
                            )
                        }
                    >
                        <item.icon size={20} className="mb-1" />
                        {item.name}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
