import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Filter, MessageCircle, User } from 'lucide-react';
import { COMPANIES, PRODUCTS, CATEGORIES } from '../data/mock';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { StarRating } from '../components/ui/StarRating';
import { motion, AnimatePresence } from 'framer-motion';

export default function CatalogPage() {
    const { companySlug } = useParams();
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const company = useMemo(() =>
        COMPANIES.find(c => c.slug === companySlug),
        [companySlug]);

    const companyProducts = useMemo(() =>
        PRODUCTS.filter(p => p.companyId === company?.id),
        [company]);

    const filteredProducts = useMemo(() => {
        return companyProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [companyProducts, search, selectedCategory]);

    const scrollToReviews = () => {
        document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (!company) {
        return <div className="p-20 text-center">Empresa no encontrada</div>;
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Company Header */}
            <div className="relative h-48 w-full bg-slate-900 lg:h-64">
                <img
                    src={company.banner}
                    alt={company.name}
                    className="h-full w-full object-cover opacity-60"
                />
                <div className="absolute inset-x-0 bottom-0 px-4 py-6 bg-gradient-to-t from-slate-950/80 to-transparent">
                    <div className="container mx-auto flex items-end justify-between">
                        <div className="flex items-end space-x-4">
                            <img
                                src={company.logo}
                                alt={company.name}
                                className="h-20 w-20 rounded-2xl bg-white p-1 ring-4 ring-white shadow-lg lg:h-28 lg:w-28"
                            />
                            <div className="mb-2">
                                <h1 className="text-2xl font-bold text-white lg:text-3xl">{company.name}</h1>
                                <p className="text-slate-300 text-sm">{company.description}</p>
                                <StarRating
                                    rating={company.rating}
                                    count={company.reviews.length}
                                    className="mt-2"
                                    onClick={scrollToReviews}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* ... existing search and filters ... */}
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 sticky top-16 z-10 bg-slate-50 py-4 border-b border-slate-200">
                    <div className="relative w-full md:w-96">
                        <Input
                            placeholder="Buscar productos..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                        <Button
                            variant={selectedCategory === 'all' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setSelectedCategory('all')}
                            className="whitespace-nowrap px-4"
                        >
                            Todos
                        </Button>
                        {CATEGORIES.map(cat => (
                            <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setSelectedCategory(cat.id)}
                                className="whitespace-nowrap px-4"
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="mt-8">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-slate-500 font-medium text-sm">
                            Mostrando {filteredProducts.length} productos
                        </h3>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    companySlug={companySlug}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <p className="text-slate-400">No se encontraron productos en esta categoría.</p>
                            <Button
                                variant="ghost"
                                className="mt-4"
                                onClick={() => { setSearch(''); setSelectedCategory('all'); }}
                            >
                                Limpiar filtros
                            </Button>
                        </div>
                    )}
                </div>

                {/* Company Reviews Section */}
                <div id="reviews" className="mt-20 border-t border-slate-200 pt-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Opiniones sobre la tienda</h2>
                            <p className="text-slate-500 text-sm">Lo que dicen otros compradores</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-slate-900">{company.rating}</span>
                            <StarRating rating={company.rating} className="mt-1" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {company.reviews.map(review => (
                            <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                                            <User size={20} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{review.user}</p>
                                            <p className="text-xs text-slate-400">{review.date}</p>
                                        </div>
                                    </div>
                                    <StarRating rating={review.rating} size={12} />
                                </div>
                                <p className="text-slate-600 italic">"{review.comment}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating Action Button (WhatsApp) */}
            <a
                href={`https://wa.me/${company.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-40"
            >
                <Button size="lg" className="rounded-full shadow-xl bg-emerald-500 hover:bg-emerald-600 h-14 w-14 p-0">
                    <MessageCircle className="h-7 w-7 text-white" />
                </Button>
            </a>
        </div>
    );
}
