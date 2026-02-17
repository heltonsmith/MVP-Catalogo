import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
    LayoutDashboard,
    Heart,
    ShoppingBag,
    MessageCircle,
    Star,
    Settings,
    LogOut,
    Home,
    User
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';

export function CustomerDashboardLayout() {
    const navigate = useNavigate();
    const { user, profile, loading, signOut } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            } else if (profile?.role === 'owner') {
                navigate('/dashboard');
            } else if (profile?.role === 'admin') {
                navigate('/admin');
            }
        }
    }, [user, profile, loading, navigate]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const menuItems = [
        { name: 'Mi Panel', icon: <LayoutDashboard size={20} />, path: '/dashboard/cliente' },
        { name: 'Favoritos', icon: <Heart size={20} />, path: '/dashboard/cliente/favoritos' },
        { name: 'Cotizaciones', icon: <ShoppingBag size={20} />, path: '/dashboard/cliente/cotizaciones' },
        { name: 'Mis Reseñas', icon: <Star size={20} />, path: '/dashboard/cliente/resenas' },
        { name: 'Mensajes', icon: <MessageCircle size={20} />, path: '/dashboard/cliente/mensajes' },
        { name: 'Mi Perfil', icon: <Settings size={20} />, path: '/dashboard/cliente/perfil' },
    ];

    if (loading) return null;

    return (
        <div className="flex h-screen w-full bg-slate-50 overscroll-none supports-[height:100dvh]:h-[100dvh]">
            {/* Sidebar for Desktop */}
            <aside className="hidden w-72 border-r border-slate-200 bg-white md:flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center overflow-hidden shadow-lg shadow-primary-200 ring-4 ring-white shrink-0">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-6 w-6 text-white" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-900 truncate">
                                {profile?.full_name || user?.user_metadata?.full_name || 'Mi Cuenta'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Cliente ktaloog
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard/cliente'}
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
                        </NavLink>
                    ))}
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
                        <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center overflow-hidden shrink-0">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-5 w-5 text-white" />
                            )}
                        </div>
                        <span className="font-bold text-slate-900 text-sm">
                            Mi Cuenta
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                        <LogOut size={20} className="text-red-500" />
                    </Button>
                </header>

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
                            end={item.path === '/dashboard/cliente'}
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
