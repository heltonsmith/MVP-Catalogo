import { useState, useMemo } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { GlobalSidebar } from './GlobalSidebar';
import { COMPANIES } from '../../data/mock';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';

export function AppLayout() {
    const { pathname } = useLocation();
    const { companyInfo } = useCart();
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Identificación de la tienda actual para branding
    const catalogMatch = pathname.match(/\/catalogo\/([^\/]+)/);
    const companySlug = catalogMatch ? catalogMatch[1] : null;

    const currentCompany = useMemo(() => {
        if (!companySlug) return null;
        const contextCompany = Object.values(companyInfo).find(c => c.slug === companySlug);
        if (contextCompany) return contextCompany;
        return COMPANIES.find(c => c.slug === companySlug);
    }, [companySlug, companyInfo]);

    const plan = currentCompany?.plan?.toLowerCase();
    const isPaidPlan = plan === 'pro' || plan === 'plus' || plan === 'custom' || plan === 'pago';
    const isLandingRoute = pathname.includes('/landing');
    const hideBranding = isLandingRoute && isPaidPlan && currentCompany?.landing_enabled !== false;
    const isCatalogRoute = pathname.includes('/catalogo/');
    const hideBrandingOnMobile = isCatalogRoute && isPaidPlan && isLandingRoute && !hideBranding;

    const showSidebar = !!user;

    return (
        <div
            style={{ paddingTop: 'calc(4rem + var(--observer-banner-height, 0px))' }}
            className="min-h-screen flex flex-col"
        >
            <Navbar
                isLandingMode={hideBranding || hideBrandingOnMobile}
                onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMobileMenuOpen={isMobileMenuOpen}
            />
            {showSidebar && (
                <GlobalSidebar
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                />
            )}
            <div className={cn(
                "flex-1 flex flex-col transition-all duration-300",
                showSidebar && "md:pl-72"
            )}>
                <main className="flex-1">
                    <Outlet />
                </main>
                <div className={(hideBranding || hideBrandingOnMobile) ? 'hidden' : ''}>
                    <Footer />
                </div>
            </div>
        </div>
    );
}
