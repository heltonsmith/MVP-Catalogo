import { useState, useMemo } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Rocket } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCart } from '../../hooks/useCart';
import { cn } from '../../utils';
import { COMPANIES } from '../../data/mock';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { carts } = useCart();
    const location = useLocation();

    // Detect current company from URL and check if cart is enabled
    const cartVisible = useMemo(() => {
        const match = location.pathname.match(/^\/catalogo\/([^/]+)/);
        if (!match) return true; // Not on a catalog page, show cart by default
        const slug = match[1];
        const company = COMPANIES.find(c => c.slug === slug);
        return company ? company.features?.cartEnabled !== false : true;
    }, [location.pathname]);

    // Calculate total items across all carts
    const totalItems = Object.values(carts).reduce((total, cartItems) => {
        return total + cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);

    const navLinks = [
        { name: 'Inicio', path: '/' },
        { name: 'Precios', path: '/precios' },
        { name: 'Demo Tienda', path: '/catalogo/ecoverde-spa?mode=demo' },
        { name: 'Demo Restaurante', path: '/catalogo/restaurante-delicias?mode=demo' },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link to="/" className="flex items-center">
                        <img
                            src="/logo-transparente.png"
                            alt="ktaloog"
                            className="h-10 w-auto"
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.path}
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

                        <Link to="/login" className="hidden md:block">
                            <Button variant="secondary" size="sm">Ingresar</Button>
                        </Link>
                        <Link to="/registro" className="hidden md:block">
                            <Button size="sm">Empezar</Button>
                        </Link>

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
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.path}
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
                        ))}
                        <div className="pt-4 flex flex-col space-y-2">
                            <Link to="/login" onClick={() => setIsOpen(false)}>
                                <Button variant="secondary" className="w-full">Ingresar</Button>
                            </Link>
                            <Link to="/registro" onClick={() => setIsOpen(false)}>
                                <Button className="w-full">Empezar gratis</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
