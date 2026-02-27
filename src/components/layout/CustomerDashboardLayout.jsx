import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Heart,
    ShoppingBag,
    Star,
    Settings,
    LogOut,
    Home,
    User,
    Menu,
    X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';
import { SEO } from '../layout/SEO';

export function CustomerDashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile, loading, signOut } = useAuth();

    // Auto-close mobile menu on navigation
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

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
        { name: 'Mi Perfil', icon: <Settings size={20} />, path: '/dashboard/cliente/perfil' },
    ];

    if (loading) return null;

    return (
        <>
            <SEO noindex={true} />
            <div className="h-full bg-slate-50 flex overflow-x-hidden relative">
                {/* Desktop Sidebar */}
                <aside className="w-72 bg-white border-r border-slate-200 fixed h-full hidden md:flex flex-col">
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
                                    Cliente Ktaloog
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
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
                                        isActive
                                            ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    )
                                }
                            >
                                <span className="transition-colors group-hover:text-inherit">
                                    {item.icon}
                                </span>
                                <span>{item.name}</span>
                            </NavLink>
                        ))}
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
                            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center overflow-hidden shrink-0">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-5 w-5 text-white" />
                                )}
                            </div>
                            <span className="font-bold text-slate-900 text-sm">Mi Cuenta</span>
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
                            <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center overflow-hidden shadow-md shrink-0">
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
                                <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">
                                    Cliente Ktaloog
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
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                                        isActive
                                            ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    )
                                }
                            >
                                {item.icon}
                                <span className="flex-1">{item.name}</span>
                            </NavLink>
                        ))}
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
        </>
    );
}
