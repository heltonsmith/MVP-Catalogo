import { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, MessageCircle, User, Globe, Instagram, Music2, Share2, Bell } from 'lucide-react';
import { COMPANIES, PRODUCTS, CATEGORIES } from '../data/mock';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { StarRating } from '../components/ui/StarRating';
import { Modal } from '../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatWidget } from '../components/chat/ChatWidget';
import { MailboxPreview } from '../components/chat/MailboxPreview';
import { useToast } from '../components/ui/Toast';

export default function CatalogPage() {
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const isDemo = searchParams.get('mode') === 'demo';

    const { companySlug } = useParams();
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isReviewsOpen, setIsReviewsOpen] = useState(false);
    const [isMailboxOpen, setIsMailboxOpen] = useState(false);

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
                <div className="absolute inset-x-0 bottom-0 px-4 py-4 sm:py-6 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent text-white">
                    <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                        {/* Shop Info Group */}
                        <div className="flex items-center md:items-end space-x-3 sm:space-x-4 w-full md:w-auto">
                            <img
                                src={company.logo}
                                alt={company.name}
                                className="h-14 w-14 sm:h-20 sm:w-20 lg:h-28 lg:w-28 rounded-[16px] sm:rounded-2xl bg-white p-1 ring-2 sm:ring-4 ring-white shadow-lg flex-shrink-0"
                            />
                            <div className="mb-0 sm:mb-2 min-w-0 flex-1">
                                <h1 className="text-lg sm:text-2xl font-bold text-white lg:text-3xl truncate leading-tight">{company.name}</h1>
                                <p className="text-slate-300 text-[10px] sm:text-sm line-clamp-1 sm:line-clamp-none opacity-90 mb-1">{company.description}</p>
                                <StarRating
                                    rating={company.rating}
                                    count={company.reviews.length}
                                    onClick={() => setIsReviewsOpen(true)}
                                />
                            </div>
                        </div>

                        {/* Actions Group */}
                        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end border-t border-white/10 pt-3 md:border-0 md:pt-0">
                            <div className="flex items-center gap-1 sm:gap-2">
                                {company.socials?.website && (
                                    <button
                                        onClick={() => {
                                            if (isDemo) {
                                                showToast('Esta es una función de demostración. En la versión real, te llevaría a la web de la tienda.', 'demo');
                                                return;
                                            }
                                            window.open(company.socials.website, '_blank');
                                        }}
                                        className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
                                    >
                                        <Globe size={16} className="sm:size-18" />
                                    </button>
                                )}
                                {company.socials?.instagram && (
                                    <button
                                        onClick={() => {
                                            if (isDemo) {
                                                showToast('Esta es una función de demostración. En la versión real, abriría el Instagram de la tienda.', 'demo');
                                                return;
                                            }
                                            window.open(company.socials.instagram, '_blank');
                                        }}
                                        className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
                                    >
                                        <Instagram size={16} className="sm:size-18" />
                                    </button>
                                )}
                                {company.socials?.tiktok && (
                                    <button
                                        onClick={() => {
                                            if (isDemo) {
                                                showToast('Esta es una función de demostración. En la versión real, abriría el TikTok de la tienda.', 'demo');
                                                return;
                                            }
                                            window.open(company.socials.tiktok, '_blank');
                                        }}
                                        className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
                                    >
                                        <Music2 size={16} className="sm:size-18" />
                                    </button>
                                )}
                            </div>

                            <div className="h-4 w-px bg-white/20 mx-1" />

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={async () => {
                                        if (isDemo) {
                                            showToast('Esta es una función de demostración. En la versión real, abriría el menú para compartir.', 'demo');
                                            return;
                                        }
                                        const shareData = {
                                            title: company.name,
                                            text: `Visita la tienda de ${company.name} en ktaloog`,
                                            url: window.location.href,
                                        };
                                        if (navigator.share) {
                                            try { await navigator.share(shareData); } catch (e) { }
                                        } else {
                                            try {
                                                await navigator.clipboard.writeText(window.location.href);
                                                showToast('¡Enlace de la tienda copiado!', 'success');
                                            } catch (e) { }
                                        }
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                    title="Compartir tienda"
                                >
                                    <Share2 size={16} className="sm:size-18" />
                                </button>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 bg-white/10 border-white/20 text-white hover:bg-white/20 text-[10px] sm:text-xs font-bold gap-2 px-3 sm:px-4"
                                    onClick={() => {
                                        if (isDemo) {
                                            showToast('Esta es una función de demostración. En la versión real, abriría el chat.', 'demo');
                                            return;
                                        }
                                        const chatBtn = document.querySelector('.fixed.bottom-6.right-6 button');
                                        if (chatBtn) chatBtn.click();
                                    }}
                                >
                                    <MessageCircle size={14} />
                                    <span className="hidden sm:inline">Chatea con nosotros</span>
                                    <span className="sm:hidden">Chat</span>
                                </Button>

                                <button
                                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                    onClick={() => setIsMailboxOpen(true)}
                                >
                                    <Bell size={16} className="sm:size-18" />
                                    <span className="absolute -top-1 -right-1 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-primary-600">
                                        3
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* ... existing search and filters ... */}
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 sticky top-16 z-10 bg-slate-50 py-4 border-b border-slate-200 w-full overflow-x-hidden">
                    <div className="relative w-full md:w-96 max-w-full">
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

                {/* Store Reviews Modal */}
                <Modal
                    isOpen={isReviewsOpen}
                    onClose={() => setIsReviewsOpen(false)}
                    title={`Opiniones de ${company.name}`}
                >
                    <div className="space-y-6 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100 gap-4">
                            <div>
                                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{company.rating}</p>
                                <StarRating rating={company.rating} count={company.reviews.length} size={14} />
                            </div>
                            <div className="text-left sm:text-right text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">
                                Calificación Tienda
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {company.reviews.map(review => (
                                <div key={review.id} className="border border-slate-100 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                <User size={18} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-800 text-sm block">{review.user}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{review.date}</span>
                                            </div>
                                        </div>
                                        <StarRating rating={review.rating} size={12} />
                                    </div>
                                    <p className="text-slate-600 text-sm italic leading-relaxed pl-12">"{review.comment}"</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2">
                            <Button
                                variant="primary"
                                className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary-200/50"
                                onClick={() => setIsReviewsOpen(false)}
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>

            {/* Mailbox Preview Modal */}
            <Modal
                isOpen={isMailboxOpen}
                onClose={() => setIsMailboxOpen(false)}
                maxWidth="6xl"
            >
                <MailboxPreview />
            </Modal>

            {/* Internal Chat Widget */}
            <ChatWidget
                companyName={company.name}
                companyLogo={company.logo}
                isDemo={isDemo}
            />
        </div>
    );
}
