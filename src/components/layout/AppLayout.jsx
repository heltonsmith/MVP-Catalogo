import { Outlet, useLocation, useParams } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { COMPANIES } from '../../data/mock';
import { useMemo } from 'react';

export function AppLayout() {
    const { pathname } = useLocation();
    const { companySlug } = useParams();

    // Identify if we are in a catalog or product page of a PRO company
    const isProCatalog = useMemo(() => {
        if (!companySlug) return false;
        const company = COMPANIES.find(c => c.slug === companySlug);
        return company?.plan === 'pro';
    }, [companySlug]);

    const isCatalogRoute = pathname.includes('/catalogo/');
    const isLandingMode = pathname.endsWith('/landing');
    const hideBrandingOnMobile = isCatalogRoute && isProCatalog && isLandingMode;

    return (
        <div className="flex min-h-screen flex-col overflow-x-hidden">
            <div className={hideBrandingOnMobile ? 'hidden md:block' : ''}>
                <Navbar />
            </div>
            <main className="flex-1">
                <Outlet />
            </main>
            <div className={hideBrandingOnMobile ? 'hidden md:block' : ''}>
                <Footer />
            </div>
        </div>
    );
}
