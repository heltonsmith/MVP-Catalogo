import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Settings, Search, Home, MessageSquare, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';
import { useNotifications } from '../../hooks/useNotifications';

import { NotificationCenter } from '../notifications/NotificationCenter';

export function AdminLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, profile, loading, signOut } = useAuth();
    const { unreadTicketsCount } = useNotifications();

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

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

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
            <Outlet />
        </div>
    );
}
