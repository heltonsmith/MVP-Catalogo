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
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
            <Outlet />
        </div>
    );
}
