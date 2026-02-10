import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import CatalogPage from '../pages/CatalogPage';
import ProductDetailsPage from '../pages/ProductDetailsPage';
import CartPage from '../pages/CartPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import DashboardOverview from '../pages/DashboardOverview';
import DashboardProducts from '../pages/DashboardProducts';
import DashboardMessages from '../pages/DashboardMessages';
import DashboardQuotes from '../pages/DashboardQuotes';
import DashboardCategories from '../pages/DashboardCategories';
import DashboardProfile from '../pages/DashboardProfile';
import UserMessages from '../pages/UserMessages';

export function AppRouter() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/explorar" element={<div className="p-20 text-center">Explorar empresas</div>} />
                <Route path="/catalogo/:companySlug" element={<CatalogPage />} />
                <Route path="/catalogo/:companySlug/producto/:productSlug" element={<ProductDetailsPage />} />
                <Route path="/carrito" element={<CartPage />} />
                <Route path="/mensajes" element={<UserMessages />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegisterPage />} />
            </Route>

            <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="productos" element={<DashboardProducts />} />
                <Route path="mensajes" element={<DashboardMessages />} />
                <Route path="cotizaciones" element={<DashboardQuotes />} />
                <Route path="categorias" element={<DashboardCategories />} />
                <Route path="perfil" element={<DashboardProfile />} />
            </Route>
        </Routes>
    );
}
