import { Outlet, useLocation, useParams } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { COMPANIES } from '../../data/mock';
import { useMemo } from 'react';
import { useCart } from '../../hooks/useCart';

export function AppLayout() {
    const { pathname } = useLocation();
    const { companyInfo } = useCart();

    // Extract slug from pathname since useParams might not catch it in the layout wrapper
    const catalogMatch = pathname.match(/\/catalogo\/([^\/]+)/);
    const companySlug = catalogMatch ? catalogMatch[1] : null;

    // Identify current company from path or context
    const currentCompany = useMemo(() => {
        if (!companySlug) return null;
        // Try to find by slug in context first (real companies)
        const contextCompany = Object.values(companyInfo).find(c => c.slug === companySlug);
        if (contextCompany) return contextCompany;

        // Fallback to mock data
        return COMPANIES.find(c => c.slug === companySlug);
    }, [companySlug, companyInfo]);

    const plan = currentCompany?.plan?.toLowerCase();
    const isPaidPlan = plan === 'pro' || plan === 'plus' || plan === 'custom' || plan === 'pago';
    const isLandingRoute = pathname.includes('/landing');

    // Hide header/footer if:
    // 1. It's a /landing route
    // 2. AND the company has a paid plan
    // 3. AND landing_enabled is true (defaulting to true for now if it's a paid landing route)
    const hideBranding = isLandingRoute && isPaidPlan && currentCompany?.landing_enabled !== false;

    // Legacy behavior for specific landing pages if needed (mobile only original logic)
    const isCatalogRoute = pathname.includes('/catalogo/');
    const hideBrandingOnMobile = isCatalogRoute && isPaidPlan && isLandingRoute && !hideBranding;

    return (
        <div id="main-scroll-container" className="flex-1 flex flex-col">
            <Navbar isLandingMode={hideBranding || hideBrandingOnMobile} />
            <main className="flex-1">
                <Outlet />
            </main>
            <div className={(hideBranding || hideBrandingOnMobile) ? 'hidden' : ''}>
                <Footer />
            </div>
        </div>
    );
}
