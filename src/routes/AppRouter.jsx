import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Layouts - Keep layouts static as they are usually small and define the shell
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { CustomerDashboardLayout } from '../components/layout/CustomerDashboardLayout';
import { DemoDashboardLayout } from '../components/layout/DemoDashboardLayout';
import { DemoStoreDashboardLayout } from '../components/layout/DemoStoreDashboardLayout';
import { DemoRestaurantDashboardLayout } from '../components/layout/DemoRestaurantDashboardLayout';
import { AdminLayout } from '../components/layout/AdminLayout';

// Lazy Loaded Pages
const LandingPage = lazy(() => import('../pages/LandingPage'));
const CatalogPage = lazy(() => import('../pages/CatalogPage'));
const DemoCatalogPage = lazy(() => import('../pages/demo/DemoCatalogPage'));
const DemoProductDetailsPage = lazy(() => import('../pages/demo/DemoProductDetailsPage'));
const ProductDetailsPage = lazy(() => import('../pages/ProductDetailsPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const PricingPage = lazy(() => import('../pages/PricingPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));
const AboutUsPage = lazy(() => import('../pages/AboutUsPage'));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage'));
const HelpPage = lazy(() => import('../pages/HelpPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Dashboard Pages
const DashboardOverview = lazy(() => import('../pages/DashboardOverview'));
const DashboardProducts = lazy(() => import('../pages/DashboardProducts'));
const DashboardMessages = lazy(() => import('../pages/DashboardMessages'));
const DashboardQuotes = lazy(() => import('../pages/DashboardQuotes'));
const DashboardCategories = lazy(() => import('../pages/DashboardCategories'));
const DashboardProfile = lazy(() => import('../pages/DashboardProfile'));

// Customer Pages
const CustomerDashboard = lazy(() => import('../pages/CustomerDashboard'));
const CustomerFavorites = lazy(() => import('../pages/customer/CustomerFavorites'));
const CustomerOrders = lazy(() => import('../pages/customer/CustomerOrders'));
const CustomerReviews = lazy(() => import('../pages/customer/CustomerReviews'));
const CustomerQuotes = lazy(() => import('../pages/customer/CustomerQuotes'));
const CustomerProfile = lazy(() => import('../pages/customer/CustomerProfile'));

// Admin Pages
const AdminOverview = lazy(() => import('../pages/admin/AdminOverview'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));
const AdminExplorer = lazy(() => import('../pages/admin/AdminExplorer'));
const AdminTickets = lazy(() => import('../pages/admin/AdminTickets'));

// Other Pages
const PublicExplorer = lazy(() => import('../pages/PublicExplorer'));
const InboxPage = lazy(() => import('../pages/InboxPage'));

const PageLoader = () => (
    <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-primary-600" size={32} />
    </div>
);

export function AppRouter() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/explorar" element={<PublicExplorer />} />
                    <Route path="/catalogo/ecoverde-spa" element={<DemoCatalogPage overrideSlug="ecoverde-spa" />} />
                    <Route path="/catalogo/technova-store" element={<DemoCatalogPage overrideSlug="technova-store" />} />
                    <Route path="/catalogo/restaurante-delicias" element={<DemoCatalogPage overrideSlug="restaurante-delicias" />} />
                    <Route path="/catalogo/ecoverde-spa/producto/:productSlug" element={<DemoProductDetailsPage overrideSlug="ecoverde-spa" />} />
                    <Route path="/catalogo/technova-store/producto/:productSlug" element={<DemoProductDetailsPage overrideSlug="technova-store" />} />
                    <Route path="/catalogo/restaurante-delicias/producto/:productSlug" element={<DemoProductDetailsPage overrideSlug="restaurante-delicias" />} />

                    <Route path="/catalogo/:companySlug" element={<CatalogPage />} />
                    <Route path="/catalogo/:companySlug/landing" element={<CatalogPage />} />
                    <Route path="/catalogo/:companySlug/producto/:productSlug" element={<ProductDetailsPage />} />

                    <Route path="/demo/catalogo/:companySlug" element={<DemoCatalogPage />} />
                    <Route path="/demo/catalogo/:companySlug/producto/:productSlug" element={<DemoProductDetailsPage />} />

                    <Route path="/carrito" element={<CartPage />} />
                    <Route path="/inbox" element={<InboxPage />} />
                    <Route path="/mensajes" element={<Navigate to="/inbox" replace />} />
                    <Route path="/precios" element={<PricingPage />} />
                    <Route path="/terminos" element={<TermsPage />} />
                    <Route path="/privacidad" element={<PrivacyPage />} />
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

                <Route path="/dashboard/cliente" element={<CustomerDashboardLayout />}>
                    <Route index element={<CustomerDashboard />} />
                    <Route path="favoritos" element={<CustomerFavorites />} />
                    <Route path="pedidos" element={<CustomerOrders />} />
                    <Route path="resenas" element={<CustomerReviews />} />
                    <Route path="cotizaciones" element={<CustomerQuotes />} />
                    <Route path="mensajes" element={<Navigate to="/inbox" replace />} />
                    <Route path="perfil" element={<CustomerProfile />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="explorador" element={<AdminExplorer />} />
                    <Route path="usuarios" element={<AdminUsers />} />
                    <Route path="tickets" element={<AdminTickets />} />
                    <Route path="configuracion" element={<AdminSettings />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route path="/demo/tienda/dashboard" element={<DemoStoreDashboardLayout />}>
                    <Route index element={<DashboardOverview />} />
                    <Route path="productos" element={<DashboardProducts />} />
                    <Route path="mensajes" element={<DashboardMessages />} />
                    <Route path="cotizaciones" element={<DashboardQuotes />} />
                    <Route path="categorias" element={<DashboardCategories />} />
                    <Route path="perfil" element={<DashboardProfile />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route path="/demo/restaurante/dashboard" element={<DemoRestaurantDashboardLayout />}>
                    <Route index element={<DashboardOverview />} />
                    <Route path="productos" element={<DashboardProducts />} />
                    <Route path="mensajes" element={<DashboardMessages />} />
                    <Route path="categorias" element={<DashboardCategories />} />
                    <Route path="perfil" element={<DashboardProfile />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route path="/demo/dashboard" element={<DemoDashboardLayout />}>
                    <Route index element={<DashboardOverview />} />
                    <Route path="productos" element={<DashboardProducts />} />
                    <Route path="mensajes" element={<DashboardMessages />} />
                    <Route path="cotizaciones" element={<DashboardQuotes />} />
                    <Route path="categorias" element={<DashboardCategories />} />
                    <Route path="perfil" element={<DashboardProfile />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
}
