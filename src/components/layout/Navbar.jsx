import { useState, useMemo, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Rocket, LogOut, User, Store, ChevronDown, Inbox } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { cn } from '../../utils';
import { COMPANIES } from '../../data/mock';

export function Navbar({ isLandingMode = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const { carts } = useCart();
    const { user, company, signOut, profile, unreadNotifications, refreshUnreadNotifications, isObserving } = useAuth();
    const [localCompany, setLocalCompany] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const [inboxUnread, setInboxUnread] = useState(0);

    const currentCompany = company || localCompany;

    useEffect(() => {
        if (!user || company || localCompany) return;
        const fetchStore = async () => {
            const { data } = await supabase.from('companies').select('*').eq('user_id', user.id).maybeSingle();
            if (data) setLocalCompany(data);
        };
        fetchStore();
    }, [user, company]);

    const [isViewOnly, setIsViewOnly] = useState(() => {
        return localStorage.getItem('demo_view_only') === 'true';
    });

    useEffect(() => {
        const handleStorageChange = () => {
            setIsViewOnly(localStorage.getItem('demo_view_only') === 'true');
        };

        const handleCustomEvent = (e) => {
            setIsViewOnly(e.detail.isViewOnly);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('demo-view-mode-change', handleCustomEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('demo-view-mode-change', handleCustomEvent);
        };
    }, []);

    // Fetch unread inbox messages
    useEffect(() => {
        if (!user) return;

        const fetchUnread = async () => {
            try {
                // Count unread as customer
                const { count: customerCount } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('customer_id', user.id)
                    .eq('sender_type', 'store')
                    .eq('is_read', false)
                    .eq('visible_to_customer', true);

                let total = customerCount || 0;

                // Count unread as store owner (if applicable)
                if (currentCompany) {
                    const { count: storeCount } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('company_id', currentCompany.id)
                        .eq('sender_type', 'customer')
                        .eq('is_read', false)
                        .eq('visible_to_store', true);
                    total += (storeCount || 0);
                }
                setInboxUnread(total);
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        fetchUnread();

        // Subscribe to messages changes
        const channel = supabase.channel(`navbar_inbox_${user.id}_${Date.now()}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages'
            }, () => {
                fetchUnread();
                if (refreshUnreadNotifications) refreshUnreadNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, currentCompany, location.pathname, unreadNotifications]); // React to global notification changes too

    // Detect current company from URL and check if cart is enabled
    const cartVisible = useMemo(() => {
        if (isViewOnly) return false;

        const match = location.pathname.match(/^\/catalogo\/([^/]+)/) || location.pathname.match(/^\/demo\/catalogo\/([^/]+)/);
        if (!match) return true; // Not on a catalog page, show cart by default
        const slug = match[1];
        const company = COMPANIES.find(c => c.slug === slug);
        return company ? company.features?.cartEnabled !== false : true;
    }, [location.pathname, isViewOnly]);

    // Calculate total items across all carts
    const totalItems = Object.values(carts).reduce((total, cartItems) => {
        return total + cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);

    const navLinks = [
        { name: 'Inicio', path: '/' },
        { name: 'Buscador Tiendas', path: '/explorar' },
        {
            name: 'Tiendas Demo',
            path: '#',
            submenu: [
                { name: 'Tienda', path: '/catalogo/ecoverde-spa' },
                { name: 'Restaurante', path: '/catalogo/restaurante-delicias' }
            ]
        },
        // { name: 'Ayuda', path: '/ayuda' },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {!isLandingMode ? (
                        <Link to="/" className="flex items-center">
                            <img
                                src="/logo-transparente.png"
                                alt="ktaloog"
                                className="h-10 w-auto"
                            />
                        </Link>
                    ) : (
                        <div className="flex items-center w-10 h-10" /> // Spacer to maintain layout or just empty
                    )}

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        {!isLandingMode && navLinks.map((link) => (
                            <div key={link.name} className="relative group">
                                {link.submenu ? (
                                    <>
                                        <button className="flex items-center text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors py-2">
                                            {link.name}
                                            <ChevronDown size={16} className="ml-1" />
                                        </button>
                                        <div className="absolute left-0 mt-0 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 pt-2">
                                            <div className="bg-white rounded-xl shadow-xl ring-1 ring-slate-200 overflow-hidden py-1">
                                                {link.submenu.map((subItem) => (
                                                    <NavLink
                                                        key={subItem.path}
                                                        to={subItem.path}
                                                        className={({ isActive }) =>
                                                            cn(
                                                                "block px-4 py-2 text-sm transition-colors hover:bg-slate-50",
                                                                isActive ? "text-primary-600 bg-primary-50 font-medium" : "text-slate-600"
                                                            )
                                                        }
                                                    >
                                                        {subItem.name}
                                                    </NavLink>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <NavLink
                                        to={link.path}
                                        className={({ isActive }) =>
                                            cn(
                                                "text-sm font-medium transition-colors hover:text-primary-600",
                                                isActive ? "text-primary-600" : "text-slate-600"
                                            )
                                        }
                                    >
                                        {link.name}
                                    </NavLink>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center space-x-2">
                        {cartVisible && (
                            <Link to="/carrito">
                                <Button variant="ghost" size="icon" className="relative">
                                    <ShoppingCart size={20} />
                                    {totalItems > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white ring-2 ring-white">
                                            {totalItems}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                        )}
                        {user && (
                            <Link
                                to="/inbox"
                                onClick={(e) => {
                                    if (window.location.pathname === '/inbox') {
                                        e.preventDefault();
                                        window.location.reload();
                                    }
                                }}
                            >
                                <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-primary-600">
                                    <Inbox size={20} />
                                    {inboxUnread > 0 && location.pathname !== '/inbox' && (
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                                            {inboxUnread}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                        )}
                        {user && (
                            <div className="flex items-center gap-1 sm:gap-3 mr-1">
                                <NotificationCenter />
                            </div>
                        )}

                        {user ? (
                            <div className="hidden md:flex items-center gap-4">
                                <Link
                                    to={(profile?.role === 'client' || profile?.role === 'user') ? '/dashboard/cliente' : '/dashboard'}
                                    className="flex flex-col items-end mr-2 text-slate-700 hover:text-primary-600 transition-colors group"
                                >
                                    <span className="text-sm font-bold truncate max-w-[150px]">
                                        {profile?.role === 'admin' || profile?.role === 'super_admin'
                                            ? 'Admin Ktaloog'
                                            : (profile?.full_name || user?.user_metadata?.full_name || company?.name || 'Mi Perfil')
                                        }
                                    </span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold group-hover:text-primary-500 transition-colors">
                                        {profile?.role === 'client' || profile?.role === 'user' ? 'Cliente' : 'Sesión Activa'}
                                    </span>
                                </Link>
                                <div className="h-8 w-px bg-slate-200 mx-1" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => signOut()}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    <LogOut size={16} className="mr-2" />
                                    Salir
                                </Button>
                                <Link to={(profile?.role === 'client' || profile?.role === 'user') ? '/dashboard/cliente' : '/dashboard'}>
                                    <Button size="sm" className="shadow-lg shadow-primary-200">
                                        Ir al Panel
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="hidden md:block">
                                    <Button variant="secondary" size="sm">Iniciar Sesión</Button>
                                </Link>
                                <Link to="/registro" className="hidden md:block">
                                    <Button size="sm">Regístrate Gratis</Button>
                                </Link>
                                {!isLandingMode && (
                                    <Link to="/precios" className="hidden md:block ml-2">
                                        <Button size="sm" className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold border-none shadow-md shadow-amber-200">
                                            Precios
                                        </Button>
                                    </Link>
                                )}
                            </>
                        )}

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            {isOpen && (
                <div className="md:hidden border-t border-slate-100 bg-white transition-all">
                    <div className="space-y-1 px-4 py-4">
                        {!isLandingMode && navLinks.map((link) => (
                            <div key={link.name}>
                                {link.submenu ? (
                                    <div className="space-y-1">
                                        <div className="px-3 py-2 text-base font-medium text-slate-800">
                                            {link.name}
                                        </div>
                                        <div className="pl-4 space-y-1 border-l-2 border-slate-100 ml-3">
                                            {link.submenu.map((subItem) => (
                                                <NavLink
                                                    key={subItem.path}
                                                    to={subItem.path}
                                                    onClick={() => setIsOpen(false)}
                                                    className={({ isActive }) =>
                                                        cn(
                                                            "block px-3 py-2 text-sm font-medium rounded-md",
                                                            isActive ? "text-primary-600 bg-primary-50" : "text-slate-500 hover:text-slate-900"
                                                        )
                                                    }
                                                >
                                                    {subItem.name}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <NavLink
                                        to={link.path}
                                        onClick={() => setIsOpen(false)}
                                        className={({ isActive }) =>
                                            cn(
                                                "block px-3 py-2 text-base font-medium rounded-md",
                                                isActive ? "bg-primary-50 text-primary-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )
                                        }
                                    >
                                        {link.name}
                                    </NavLink>
                                )}
                            </div>
                        ))}
                        <div className="pt-4 flex flex-col space-y-2">
                            {user ? (
                                <>
                                    <div className="px-3 py-2 flex items-center gap-3 bg-slate-50 rounded-xl mb-2">
                                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                            <Store size={20} />
                                        </div>
                                        <div>
                                            {profile?.role === 'admin' || profile?.role === 'super_admin' ? (
                                                <p className="font-bold text-slate-900">Admin Ktaloog</p>
                                            ) : company?.slug ? (
                                                <Link
                                                    to={`/catalogo/${company.slug}`}
                                                    onClick={() => setIsOpen(false)}
                                                    className="font-bold text-slate-900 hover:text-primary-600 transition-colors"
                                                >
                                                    {company?.name || 'Mi Tienda'}
                                                </Link>
                                            ) : (
                                                <p className="font-bold text-slate-900">{company?.name || 'Mi Tienda'}</p>
                                            )}
                                            <p className="text-xs text-slate-500">
                                                {profile?.role === 'admin' || profile?.role === 'super_admin'
                                                    ? 'Admin Ktaloog'
                                                    : (profile?.email || user?.email)
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <Link to={(profile?.role === 'client' || profile?.role === 'user') ? '/dashboard/cliente' : '/dashboard'} onClick={() => setIsOpen(false)}>
                                        <Button className="w-full">Ir al Panel</Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                            signOut();
                                            setIsOpen(false);
                                        }}
                                    >
                                        Cerrar Sesión
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setIsOpen(false)}>
                                        <Button variant="secondary" className="w-full">Iniciar Sesión</Button>
                                    </Link>
                                    <Link to="/registro" onClick={() => setIsOpen(false)}>
                                        <Button className="w-full">Regístrate Gratis</Button>
                                    </Link>
                                    {!isLandingMode && (
                                        <Link to="/precios" onClick={() => setIsOpen(false)}>
                                            <Button variant="ghost" className="w-full">Precios</Button>
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
