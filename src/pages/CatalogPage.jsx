import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Search, MessageCircle, User, Globe, Instagram, Music2, Share2, Bell, QrCode, BadgeCheck, Loader2, LayoutDashboard, Eye, Move, Maximize, Save, X } from 'lucide-react';
import QRCode from "react-qr-code";
import { supabase } from '../lib/supabase';
import { COMPANIES, PRODUCTS, CATEGORIES } from '../data/mock';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StarRating } from '../components/ui/StarRating';
import { Modal } from '../components/ui/Modal';
import { ChatWidget } from '../components/chat/ChatWidget';
import { MailboxPreview } from '../components/chat/MailboxPreview';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { cn, formatCurrency } from '../utils';
import NotFoundPage from './NotFoundPage';

export default function CatalogPage() {
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const isDemo = searchParams.get('mode') === 'demo';
    const { companySlug } = useParams();

    const [company, setCompany] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isReviewsOpen, setIsReviewsOpen] = useState(false);
    const [isMailboxOpen, setIsMailboxOpen] = useState(false);
    const [isQROpen, setIsQROpen] = useState(false);

    useEffect(() => {
        const fetchCatalogData = async () => {
            setLoading(true);
            try {
                // Check if it's a demo slug
                const demoCompany = COMPANIES.find(c => c.slug === companySlug);

                if (demoCompany) {
                    setCompany(demoCompany);
                    const demoProducts = PRODUCTS.filter(p => p.companyId === demoCompany.id);

                    const enrichedProducts = demoProducts.map(p => ({
                        ...p,
                        categories: {
                            id: p.categories[0],
                            name: p.categories.map(catId => {
                                const foundCat = CATEGORIES.find(c => c.id === catId);
                                return foundCat ? foundCat.name : catId;
                            }).join(', ')
                        }
                    }));

                    setProducts(enrichedProducts);

                    const uniqueCategories = [];
                    const categoryIds = new Set();
                    enrichedProducts.forEach(p => {
                        const firstCatId = p.categories.id.split(',')[0].trim();
                        // This logic is a bit simplified for the demo but ensures categories list is built
                        p.categories.id.split(',').forEach((cId, idx) => {
                            const trimmedId = cId.trim();
                            const catName = p.categories.name.split(',')[idx].trim();
                            if (!categoryIds.has(trimmedId)) {
                                categoryIds.add(trimmedId);
                                uniqueCategories.push({ id: trimmedId, name: catName });
                            }
                        });
                    });
                    setCategories(uniqueCategories);

                    setLoading(false);
                    return;
                }

                // 1. Fetch Company
                const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('slug', companySlug)
                    .single();

                if (companyError || !companyData) {
                    throw new Error('Company not found');
                }
                setCompany(companyData);

                // 2. Fetch Products and Categories
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*, categories(id, name)')
                    .eq('company_id', companyData.id)
                    .eq('available', true);

                if (productsError) throw productsError;

                setProducts(productsData || []);

                // Extract unique categories from products
                const uniqueCategories = [];
                const categoryIds = new Set();

                productsData.forEach(p => {
                    if (p.categories) {
                        if (!categoryIds.has(p.categories.id)) {
                            categoryIds.add(p.categories.id);
                            uniqueCategories.push(p.categories);
                        }
                    }
                });
                setCategories(uniqueCategories);

            } catch (error) {
                console.error('Error fetching catalog:', error);
                setCompany(null);
            } finally {
                setLoading(false);
            }
        };

        if (companySlug) {
            fetchCatalogData();
        }
    }, [companySlug]);

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name ? p.name.toLowerCase().includes(search.toLowerCase()) : false;
        const matchesCategory = selectedCategory === 'all' ||
            (p.categories && (
                typeof p.categories.id === 'string' && p.categories.id.includes(selectedCategory)
            ));
        return matchesSearch && matchesCategory;
    });

    const { user } = useAuth();
    const [editMode, setEditMode] = useState(null); // 'banner' or 'logo'
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [tempSettings, setTempSettings] = useState(null);
    const containerRef = useRef(null);

    const isOwner = user?.id === company?.user_id && !isDemo;

    const DEFAULT_BRANDING = {
        banner: { x: 50, y: 50, zoom: 100 },
        logo: { x: 50, y: 50, zoom: 100 }
    };

    const branding = company?.branding_settings || DEFAULT_BRANDING;

    const handleStartEdit = (type) => {
        if (!isOwner) return;
        setEditMode(type);
        setTempSettings(JSON.parse(JSON.stringify(branding)));
    };

    const handleSaveBranding = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({ branding_settings: tempSettings })
                .eq('id', company.id);

            if (error) throw error;
            setCompany({ ...company, branding_settings: tempSettings });
            setEditMode(null);
            showToast("Ajustes guardados correctamente", "success");
        } catch (error) {
            console.error('Error saving branding:', error);
            showToast("Error al guardar los ajustes", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !editMode) return;

        const rect = containerRef.current.getBoundingClientRect();
        const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

        setTempSettings(prev => {
            const newSettings = { ...prev };
            newSettings[editMode].x = Math.max(0, Math.min(100, prev[editMode].x - deltaX));
            newSettings[editMode].y = Math.max(0, Math.min(100, prev[editMode].y - deltaY));
            return newSettings;
        });

        setDragStart({ x: e.clientX, y: e.clientY });
    }, [isDragging, editMode, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!company) {
        return <NotFoundPage />;
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Company Header */}
            <div
                ref={editMode === 'banner' ? containerRef : null}
                className={cn(
                    "relative h-48 w-full bg-slate-900 lg:h-64 overflow-hidden group/banner",
                    editMode === 'banner' ? "cursor-move" : (isOwner && "cursor-pointer")
                )}
                onDoubleClick={() => handleStartEdit('banner')}
                onMouseDown={(e) => {
                    if (editMode === 'banner') {
                        setIsDragging(true);
                        setDragStart({ x: e.clientX, y: e.clientY });
                    }
                }}
            >
                {company.banner ? (
                    <img
                        src={company.banner}
                        alt={company.name}
                        className="h-full w-full object-cover transition-transform duration-300"
                        style={{
                            objectPosition: editMode === 'banner'
                                ? `${tempSettings.banner.x}% ${tempSettings.banner.y}%`
                                : `${branding.banner?.x ?? 50}% ${branding.banner?.y ?? 50}%`,
                            transform: `scale(${(editMode === 'banner' ? tempSettings.banner.zoom : (branding.banner?.zoom ?? 100)) / 100})`,
                            opacity: editMode === 'banner' ? 1 : 0.6
                        }}
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />
                )}

                {/* Banner Overlay Controls */}
                {isOwner && !editMode && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-slate-900 text-xs font-bold shadow-xl">
                            <Move size={14} /> Doble clic para ajustar banner
                        </div>
                    </div>
                )}

                {editMode === 'banner' && (
                    <div className="absolute top-4 right-4 flex flex-col gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl z-20 border border-white">
                        <div className="flex items-center gap-3 mb-2">
                            <Maximize size={16} className="text-slate-400" />
                            <input
                                type="range"
                                min="100"
                                max="200"
                                value={tempSettings.banner.zoom}
                                onChange={(e) => setTempSettings({
                                    ...tempSettings,
                                    banner: { ...tempSettings.banner, zoom: parseInt(e.target.value) }
                                })}
                                className="w-32 accent-primary-600"
                            />
                            <span className="text-[10px] font-black text-slate-900 w-8">{tempSettings.banner.zoom}%</span>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveBranding} className="h-8 text-[10px] gap-1 px-3">
                                <Save size={12} /> Guardar
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditMode(null)} className="h-8 text-[10px] gap-1 px-3">
                                <X size={12} /> Cancelar
                            </Button>
                        </div>
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 px-4 py-4 sm:py-6 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent text-white pointer-events-none">
                    <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pointer-events-auto">
                        {/* Shop Info Group */}
                        <div className="flex items-center md:items-end space-x-3 sm:space-x-4 w-full md:w-auto">
                            <div
                                ref={editMode === 'logo' ? containerRef : null}
                                className={cn(
                                    "relative h-14 w-14 sm:h-20 sm:w-20 lg:h-28 lg:w-28 rounded-[16px] sm:rounded-2xl bg-white p-1 ring-2 sm:ring-4 ring-white shadow-lg flex-shrink-0 group/logo overflow-hidden",
                                    editMode === 'logo' ? "cursor-move" : (isOwner && "cursor-pointer")
                                )}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit('logo');
                                }}
                                onMouseDown={(e) => {
                                    if (editMode === 'logo') {
                                        e.stopPropagation();
                                        setIsDragging(true);
                                        setDragStart({ x: e.clientX, y: e.clientY });
                                    }
                                }}
                            >
                                {company.logo ? (
                                    <img
                                        src={company.logo}
                                        alt={company.name}
                                        className="h-full w-full object-cover transition-transform duration-300"
                                        style={{
                                            objectPosition: editMode === 'logo'
                                                ? `${tempSettings.logo.x}% ${tempSettings.logo.y}%`
                                                : `${branding.logo?.x ?? 50}% ${branding.logo?.y ?? 50}%`,
                                            transform: `scale(${(editMode === 'logo' ? tempSettings.logo.zoom : (branding.logo?.zoom ?? 100)) / 100})`,
                                        }}
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <span className="text-slate-900 font-bold text-xl">{company.name.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                )}

                                {/* Logo Edit Overlay */}
                                {isOwner && !editMode && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity bg-black/20">
                                        <Move size={20} className="text-white drop-shadow-lg" />
                                    </div>
                                )}
                            </div>

                            {editMode === 'logo' && (
                                <div className="mb-2 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-white flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Maximize size={14} className="text-slate-400" />
                                        <input
                                            type="range"
                                            min="100"
                                            max="300"
                                            value={tempSettings.logo.zoom}
                                            onChange={(e) => setTempSettings({
                                                ...tempSettings,
                                                logo: { ...tempSettings.logo, zoom: parseInt(e.target.value) }
                                            })}
                                            className="w-24 accent-primary-600"
                                        />
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="sm" onClick={handleSaveBranding} className="h-7 text-[9px] px-2">Save</Button>
                                        <Button size="sm" variant="secondary" onClick={() => setEditMode(null)} className="h-7 text-[9px] px-2">X</Button>
                                    </div>
                                </div>
                            )}

                            <div className="mb-0 sm:mb-2 min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-xl sm:text-2xl font-bold text-white lg:text-3xl truncate leading-tight">{company.name}</h1>
                                    {(company.plan === 'pro' || isDemo) && (
                                        <BadgeCheck className="h-6 w-6 sm:h-7 sm:w-7 text-blue-400 fill-blue-400/20 flex-shrink-0" title="Cuenta Verificada (Pro)" />
                                    )}
                                </div>
                                <p className="text-slate-300 text-xs sm:text-sm line-clamp-2 sm:line-clamp-none opacity-90 mb-1">{company.description}</p>
                                <StarRating
                                    rating={company.rating || 4.9}
                                    count={company.reviews?.length || 0}
                                    onClick={() => setIsReviewsOpen(true)}
                                />
                            </div>
                        </div>

                        {/* Actions Group */}
                        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end border-t border-white/10 pt-3 md:border-0 md:pt-0">
                            {/* Demo Admin Link Button */}
                            {(isDemo || company.slug === 'restaurante-delicias' || company.slug === 'tienda-moda') && (
                                <Link to={company.slug === 'restaurante-delicias' ? '/demo/restaurante/dashboard' : '/demo/tienda/dashboard'}>
                                    <Button variant="secondary" size="sm" className="hidden sm:flex h-8 bg-white/20 border-white/30 text-white hover:bg-white/30 text-[10px] sm:text-xs font-bold gap-1 px-3">
                                        <LayoutDashboard size={14} />
                                        Ver Panel
                                    </Button>
                                </Link>
                            )}

                            <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                    onClick={() => showToast('Abriendo sitio web...', 'success')}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                    title="Sitio Web"
                                >
                                    <Globe size={16} className="sm:size-18" />
                                </button>
                                <button
                                    onClick={() => showToast('Abriendo Instagram...', 'success')}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                    title="Instagram"
                                >
                                    <Instagram size={16} className="sm:size-18" />
                                </button>
                                <button
                                    onClick={() => showToast('Abriendo TikTok...', 'success')}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                    title="TikTok"
                                >
                                    <Music2 size={16} className="sm:size-18" />
                                </button>
                            </div>

                            <div className="h-4 w-px bg-white/20 mx-1" />

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={async () => {
                                        const shareData = {
                                            title: company.name,
                                            text: `Visita la tienda de ${company.name} en ktaloog`,
                                            url: window.location.href,
                                        };
                                        if (navigator.share) {
                                            try { await navigator.share(shareData); } catch (e) { }
                                        } else {
                                            showToast('Enlace de la tienda copiado', 'success');
                                            try { await navigator.clipboard.writeText(window.location.href); } catch (e) { }
                                        }
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                    title="Compartir"
                                >
                                    <Share2 size={16} className="sm:size-18" />
                                </button>

                                <button
                                    onClick={() => setIsQROpen(true)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                    title="Código QR"
                                >
                                    <QrCode size={16} className="sm:size-18" />
                                </button>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 bg-white/10 border-white/20 text-white hover:bg-white/20 text-[10px] sm:text-xs font-bold gap-2 px-3 sm:px-4"
                                    onClick={() => showToast('Función de chat activada', 'info')}
                                >
                                    <MessageCircle size={14} />
                                    <span className="hidden sm:inline">Chatea con nosotros</span>
                                    <span className="sm:hidden">Chat</span>
                                </Button>

                                <button
                                    onClick={() => showToast('No tienes notificaciones nuevas', 'info')}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95 relative"
                                    title="Notificaciones"
                                >
                                    <Bell size={16} className="sm:size-18" />
                                    <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-slate-900" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* Search and Filters */}
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 sticky top-16 z-10 bg-slate-50 py-4 border-b border-slate-200 w-full">
                    <div className="relative w-full md:w-96 max-w-full">
                        <Input
                            placeholder="Buscar productos..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide no-scrollbar">
                        <Button
                            variant={selectedCategory === 'all' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => {
                                setSelectedCategory('all');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="whitespace-nowrap px-4"
                        >
                            Todos
                        </Button>
                        {categories.map(cat => (
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

                {/* Product Grid or Grouped List */}
                <div className="mt-8 space-y-12">
                    {company.slug === 'restaurante-delicias' ? (
                        // Restaurant Layout: Grouped by Category, View Only, No Cart
                        // NOW USING GRID LAYOUT LIKE STORE per user request
                        <div className="space-y-16">
                            {categories.map(category => {
                                const categoryProducts = filteredProducts.filter(p => p.categories.id === category.id);
                                if (categoryProducts.length === 0) return null;

                                return (
                                    <div key={category.id} id={category.id} className="scroll-mt-24">
                                        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
                                            <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                                            <h3 className="text-2xl font-bold text-slate-800">
                                                {category.name}
                                            </h3>
                                            <span className="text-slate-400 text-sm font-medium ml-2">({categoryProducts.length})</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {categoryProducts.map(product => (
                                                <ProductCard
                                                    key={product.id}
                                                    product={product}
                                                    companySlug={company.slug}
                                                    isDemo={isDemo}
                                                    cartEnabled={false} // Store logic, but no cart
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // Standard Store Layout
                        <>
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
                                            companySlug={company.slug}
                                            isDemo={isDemo}
                                            cartEnabled={true}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="h-10 w-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">No se encontraron productos</h3>
                                    <p className="text-slate-500">Intenta con otra categoría o búsqueda.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Chat Widget triggers when isMailboxOpen is true or via its own internal floating button if we render it always */}
            {/* We render ChatWidget always, but pass isDemo={false} for these Pro Demos to enable mock chat */}
            <ChatWidget
                companyName={company.name}
                companyLogo={company.logo}
                isDemo={false} // Force "Pro" behavior (mock chat) for these demos as requested
            />

            {/* QR Code Modal */}
            <Modal
                isOpen={isQROpen}
                onClose={() => setIsQROpen(false)}
                title="Escanea para visitar"
                maxWidth="sm"
            >
                <div className="flex flex-col items-center justify-center p-8 space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div style={{ height: "auto", margin: "0 auto", maxWidth: 200, width: "100%" }}>
                            <QRCode
                                size={256}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={window.location.href}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                    </div>
                    <p className="text-center text-slate-500 text-sm">
                        Escanea este código con tu cámara para abrir esta tienda en tu celular.
                    </p>
                    <Button onClick={() => setIsQROpen(false)} className="w-full">
                        Cerrar
                    </Button>
                </div>
            </Modal>

            {/* Reviews Modal for Store */}
            <Modal
                isOpen={isReviewsOpen}
                onClose={() => setIsReviewsOpen(false)}
                title={`Opiniones de ${company.name}`}
            >
                <div className="space-y-6 p-4 sm:p-6">
                    <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div>
                            <p className="text-4xl font-black text-slate-900 tracking-tight">{company.rating || 0}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <StarRating rating={company.rating || 0} count={company.reviews?.length || 0} size={16} />
                            </div>
                        </div>
                        <div className="text-right text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            CALIFICACIÓN TIENDA
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {/* Use valid reviews or empty array */}
                        {(company.reviews || []).map(review => (
                            <div key={review.id} className="border border-slate-100 p-5 rounded-2xl hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                            <User size={20} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900 text-sm block">{review.user}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{review.date}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 text-white px-2 py-1 rounded-lg text-xs font-black">
                                        {review.rating}
                                    </div>
                                </div>
                                <div className="flex mb-2">
                                    <StarRating rating={review.rating} size={12} />
                                </div>
                                <p className="text-slate-600 text-sm italic leading-relaxed">"{review.comment}"</p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2">
                        <Button
                            variant="primary"
                            className="w-full h-12 rounded-xl font-bold shadow-lg shadow-emerald-200"
                            onClick={() => setIsReviewsOpen(false)}
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
