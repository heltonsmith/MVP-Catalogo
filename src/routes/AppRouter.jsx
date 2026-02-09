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

export function AppRouter() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/explorar" element={<div className="p-20 text-center">Explorar empresas</div>} />
                <Route path="/catalogo/:companySlug" element={<CatalogPage />} />
                <Route path="/catalogo/:companySlug/producto/:productSlug" element={<ProductDetailsPage />} />
                <Route path="/carrito" element={<CartPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegisterPage />} />
            </Route>

            <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="productos" element={<DashboardProducts />} />
                <Route path="categorias" element={<div className="p-8">Gestión de Categorías (Próximamente)</div>} />
                <Route path="perfil" element={<div className="p-8">Ajustes del Perfil (Próximamente)</div>} />
            </Route>
        </Routes>
    );
}
