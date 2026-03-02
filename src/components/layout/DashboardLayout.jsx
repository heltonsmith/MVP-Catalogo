import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Settings,
    LogOut,
    Layers,
    ExternalLink,
    Store,
    Lock,
    Home,
    Menu,
    X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';
import { TooltipCard } from '../ui/Tooltip';

import { NotificationCenter } from '../notifications/NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';

export function DashboardLayout() {
    const navigate = useNavigate();
    const { user, loading, profile } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            } else {
                const role = profile?.role || user?.user_metadata?.role;
                if (role === 'admin') {
                    navigate('/admin');
                } else if (role === 'client' || role === 'user') {
                    navigate('/dashboard/cliente');
                }
            }
        }
    }, [user, profile, loading, navigate]);

    if (loading) return null;

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
            <Outlet />
        </div>
    );
}
