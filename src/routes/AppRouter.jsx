import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import CatalogPage from '../pages/CatalogPage';
import ProductDetailsPage from '../pages/ProductDetailsPage';
import CartPage from '../pages/CartPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { DemoDashboardLayout } from '../components/layout/DemoDashboardLayout';
import { DemoStoreDashboardLayout } from '../components/layout/DemoStoreDashboardLayout';
import { DemoRestaurantDashboardLayout } from '../components/layout/DemoRestaurantDashboardLayout';
import DashboardOverview from '../pages/DashboardOverview';
import DashboardProducts from '../pages/DashboardProducts';
import DashboardMessages from '../pages/DashboardMessages';
import DashboardQuotes from '../pages/DashboardQuotes';
import DashboardCategories from '../pages/DashboardCategories';
import DashboardProfile from '../pages/DashboardProfile';
import UserMessages from '../pages/UserMessages';
import PricingPage from '../pages/PricingPage';
import TermsPage from '../pages/TermsPage';
import AboutUsPage from '../pages/AboutUsPage';
import HelpPage from '../pages/HelpPage';
import NotFoundPage from '../pages/NotFoundPage';
import { AdminLayout } from '../components/layout/AdminLayout';
import AdminOverview from '../pages/admin/AdminOverview';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminExplorer from '../pages/admin/AdminExplorer';

import PublicExplorer from '../pages/PublicExplorer';

export function AppRouter() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/explorar" element={<PublicExplorer />} />
                <Route path="/catalogo/:companySlug" element={<CatalogPage />} />
                <Route path="/catalogo/:companySlug/landing" element={<CatalogPage />} />
                <Route path="/catalogo/:companySlug/producto/:productSlug" element={<ProductDetailsPage />} />
                <Route path="/carrito" element={<CartPage />} />
                <Route path="/mensajes" element={<UserMessages />} />
                <Route path="/precios" element={<PricingPage />} />
                <Route path="/terminos" element={<TermsPage />} />
                <Route path="/nosotros" element={<AboutUsPage />} />
                <Route path="/ayuda" element={<HelpPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegisterPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="productos" element={<DashboardProducts />} />
                <Route path="mensajes" element={<DashboardMessages />} />
                <Route path="cotizaciones" element={<DashboardQuotes />} />
                <Route path="categorias" element={<DashboardCategories />} />
                <Route path="perfil" element={<DashboardProfile />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="explorador" element={<AdminExplorer />} />
                <Route path="usuarios" element={<AdminUsers />} />
                <Route path="configuracion" element={<AdminSettings />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Store Demo Dashboard Routes */}
            <Route path="/demo/tienda/dashboard" element={<DemoStoreDashboardLayout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="productos" element={<DashboardProducts />} />
                <Route path="mensajes" element={<DashboardMessages />} />
                <Route path="cotizaciones" element={<DashboardQuotes />} />
                <Route path="categorias" element={<DashboardCategories />} />
                <Route path="perfil" element={<DashboardProfile />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Restaurant Demo Dashboard Routes */}
            <Route path="/demo/restaurante/dashboard" element={<DemoRestaurantDashboardLayout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="productos" element={<DashboardProducts />} />
                <Route path="mensajes" element={<DashboardMessages />} />
                <Route path="categorias" element={<DashboardCategories />} />
                <Route path="perfil" element={<DashboardProfile />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Legacy Demo Dashboard Route (redirect to store) */}
            <Route path="/demo/dashboard" element={<DemoDashboardLayout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="productos" element={<DashboardProducts />} />
                <Route path="mensajes" element={<DashboardMessages />} />
                <Route path="cotizaciones" element={<DashboardQuotes />} />
                <Route path="categorias" element={<DashboardCategories />} />
                <Route path="perfil" element={<DashboardProfile />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
