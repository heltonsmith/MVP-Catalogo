import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, User, Globe, Instagram, Music2, Share2, QrCode, BadgeCheck, Loader2, LayoutDashboard, Eye, Move, Maximize, Save, X, Heart, Pencil } from 'lucide-react';
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
import { useSettings } from '../hooks/useSettings';
import { useCart } from '../hooks/useCart';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import { cn, formatCurrency } from '../utils';
import NotFoundPage from './NotFoundPage';

export default function CatalogPage() {
    const { showToast } = useToast();
    const { user, profile, refreshCompany } = useAuth();
    const { setCompanyInfo } = useCart();
    const [searchParams] = useSearchParams();
    const isDemo = searchParams.get('mode') === 'demo';
    const { companySlug } = useParams();
    const navigate = useNavigate();

    const [company, setCompany] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isReviewsOpen, setIsReviewsOpen] = useState(false);
    const [isMailboxOpen, setIsMailboxOpen] = useState(false);
    const [isQROpen, setIsQROpen] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [tempReview, setTempReview] = useState({ rating: 0, comment: '' });
    const { getSetting } = useSettings();

    const getLimit = () => {
        if (!company) return 10;
        if (company.plan === 'custom') return Infinity;
        const limitKey = `${company.plan}_plan_product_limit`;
        const defaultValue = company.plan === 'free' ? '5' : company.plan === 'plus' ? '100' : '500';
        return parseInt(getSetting(limitKey, defaultValue));
    };

    const productLimit = getLimit();

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

                // 2. Fetch Reviews for real rating
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('company_id', companyData.id);

                const realRating = reviewsData && reviewsData.length > 0
                    ? parseFloat((reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length).toFixed(1))
                    : 0;

                const fullCompany = {
                    ...companyData,
                    rating: realRating,
                    reviews: reviewsData || []
                };
                setCompany(fullCompany);

                // Store company info in cart context for CartPage resolution
                setCompanyInfo(companyData.id, {
                    name: companyData.name,
                    slug: companyData.slug,
                    whatsapp: companyData.whatsapp,
                    logo: companyData.logo
                });

                // 3. Fetch Products with new schema
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select(`
                        *,
                        product_images(image_url, display_order),
                        product_categories(
                            categories(id, name)
                        ),
                        wholesale_prices
                    `)
                    .eq('company_id', companyData.id)
                    .eq('available', true);

                if (productsError) throw productsError;

                // Transform products to include categories array and images
                const transformedProducts = (productsData || []).map(product => ({
                    ...product,
                    categories: product.product_categories?.map(pc => pc.categories) || [],
                    images: product.product_images?.sort((a, b) => a.display_order - b.display_order).map(img => img.image_url) || []
                }));

                setProducts(transformedProducts);

                // Extract unique categories from products
                const uniqueCategories = [];
                const categoryIds = new Set();

                transformedProducts.forEach(p => {
                    if (p.categories && Array.isArray(p.categories)) {
                        p.categories.forEach(cat => {
                            if (cat && !categoryIds.has(cat.id)) {
                                categoryIds.add(cat.id);
                                uniqueCategories.push(cat);
                            }
                        });
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

    // Track store view
    useEffect(() => {
        const trackView = async () => {
            // Only track views for real stores (not demo stores)
            if (company && company.id && !company.slug?.includes('demo')) {
                try {
                    await supabase.rpc('increment_views', { company_id: company.id });
                } catch (error) {
                    console.error('Error tracking view:', error);
                    // Fail silently - don't block user experience
                }
            }
        };

        trackView();
    }, [company?.id]);


    useEffect(() => {
        if (user && company) {
            checkIfFavorite();
            checkIfReviewed();
        }
    }, [user, company]);

    const checkIfFavorite = async () => {
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('target_id', company.id)
                .maybeSingle();

            setIsFavorite(!!data);
        } catch (error) {
            console.error('Error checking favorite:', error);
        }
    };

    const checkIfReviewed = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('id')
                .eq('user_id', user.id)
                .eq('company_id', company.id)
                .maybeSingle();

            setHasReviewed(!!data);
        } catch (error) {
            console.error('Error checking review:', error);
        }
    };

    const toggleFavorite = async () => {
        if (!user) {
            showToast("Debes iniciar sesión para guardar favoritos", "info");
            return;
        }

        try {
            if (isFavorite) {
                await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('target_id', company.id);
                setIsFavorite(false);
                showToast("Eliminado de favoritos", "success");
            } else {
                await supabase
                    .from('favorites')
                    .insert([{
                        user_id: user.id,
                        target_id: company.id,
                        type: company.business_type || 'retail'
                    }]);
                setIsFavorite(true);
                showToast("¡Guardado en favoritos!", "success");
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast("Error al procesar solicitud", "error");
        }
    };

    const handleSubmitReview = async () => {
        if (!user) return;
        if (tempReview.rating === 0) {
            showToast("Por favor selecciona una calificación", "error");
            return;
        }

        try {
            const { error } = await supabase
                .from('reviews')
                .insert([{
                    user_id: user.id,
                    company_id: company.id,
                    rating: tempReview.rating,
                    comment: tempReview.comment,
                    customer_name: profile?.full_name || 'Anónimo'
                }]);

            if (error) throw error;

            showToast("¡Gracias por tu opinión!", "success");
            setHasReviewed(true);
            setTempReview({ rating: 0, comment: '' });

            // Optionally refresh reviews here if they are fetched live
        } catch (error) {
            console.error('Error submitting review:', error);
            showToast("No se pudo enviar la reseña", "error");
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name ? p.name.toLowerCase().includes(search.toLowerCase()) : false;
        const matchesCategory = selectedCategory === 'all' ||
            (p.categories && (
                (Array.isArray(p.categories) && p.categories.some(cat => cat.id === selectedCategory)) ||
                (typeof p.categories.id === 'string' && p.categories.id.includes(selectedCategory))
            ));
        return matchesSearch && matchesCategory;
    }).slice(0, productLimit);

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
                                <div className="group/desc relative">
                                    <p className="text-slate-300 text-xs sm:text-sm line-clamp-2 sm:line-clamp-none opacity-90 mb-1 pr-6">{company.description || (isOwner ? 'Añade una descripción para tu tienda...' : '')}</p>
                                    {isOwner && (
                                        <button
                                            onClick={() => navigate('/dashboard/perfil')}
                                            className="absolute right-0 top-0 p-1 opacity-0 group-hover/desc:opacity-100 transition-opacity text-white hover:text-primary-400"
                                            title="Editar descripción"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                    )}
                                </div>
                                {/* Rating Row */}
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {company.reviews?.length > 0 ? (
                                        <StarRating
                                            rating={company.rating}
                                            count={company.reviews.length}
                                            size={16}
                                            onClick={() => setIsReviewsOpen(true)}
                                        />
                                    ) : (
                                        <span
                                            onClick={() => setIsReviewsOpen(true)}
                                            className="text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-900/40 px-3 py-1.5 rounded-full ring-1 ring-white/10 backdrop-blur-sm shadow-xl cursor-pointer hover:bg-slate-900/60 transition-colors"
                                        >
                                            Aún no hay calificación y comentarios
                                        </span>
                                    )}
                                </div>
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
                                    onClick={toggleFavorite}
                                    className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-95 shadow-sm",
                                        isFavorite
                                            ? "bg-rose-500 text-white shadow-rose-200"
                                            : "bg-white/10 text-white hover:bg-white/20"
                                    )}
                                    title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                                >
                                    <Heart size={16} className={cn("sm:size-18", isFavorite && "fill-current")} />
                                </button>

                                {(company.website || company.socials?.website) && (
                                    <a
                                        href={company.website || company.socials?.website}
                                        target="_blank"
                                        rel="nofollow noopener noreferrer"
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                        title="Sitio Web"
                                    >
                                        <Globe size={16} className="sm:size-18" />
                                    </a>
                                )}
                                {company.socials?.instagram && (
                                    <a
                                        href={company.socials.instagram}
                                        target="_blank"
                                        rel="nofollow noopener noreferrer"
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                        title="Instagram"
                                    >
                                        <Instagram size={16} className="sm:size-18" />
                                    </a>
                                )}
                                {company.socials?.tiktok && (
                                    <a
                                        href={company.socials.tiktok}
                                        target="_blank"
                                        rel="nofollow noopener noreferrer"
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                        title="TikTok"
                                    >
                                        <Music2 size={16} className="sm:size-18" />
                                    </a>
                                )}
                                {isOwner && (!company.website || !company.socials?.instagram || !company.socials?.tiktok) && (
                                    <button
                                        onClick={() => navigate('/dashboard/perfil')}
                                        className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-white/30 text-white/50 hover:text-white hover:border-white transition-all"
                                        title="Agregar redes sociales"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                )}
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

                                {company?.plan !== 'free' && (
                                    <>
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
                                            onClick={() => {
                                                if (!user) {
                                                    showToast('Debes registrarte para chatear con la tienda', 'info');
                                                    return;
                                                }
                                                showToast('Función de chat activada', 'info');
                                            }}
                                        >
                                            <MessageCircle size={14} />
                                            <span className="hidden sm:inline">Chatea con nosotros</span>
                                            <span className="sm:hidden">Chat</span>
                                        </Button>
                                    </>
                                )}

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

            {/* Chat Widget - Premium only */}
            {user && company?.plan !== 'free' && (
                <ChatWidget
                    companyName={company.name}
                    companyLogo={company.logo}
                    isDemo={false}
                />
            )}

            {/* QR Code Modal - Premium only */}
            {company?.plan !== 'free' && (
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
            )}

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
                        {company.reviews?.length > 0 ? (
                            company.reviews.map(review => (
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
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-sm font-medium text-slate-500 italic">Aún no hay calificación y comentarios</p>
                            </div>
                        )}
                    </div>

                    {user && !hasReviewed && !isOwner && (
                        <div className="pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-black text-slate-900 mb-4">Deja tu opinión</h4>
                            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="flex justify-center">
                                    <StarRating
                                        interactive
                                        onRate={(val) => setTempReview(prev => ({ ...prev, rating: val }))}
                                        rating={tempReview.rating}
                                        size={32}
                                    />
                                </div>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-all resize-none min-h-[100px]"
                                    placeholder="Cuéntanos tu experiencia (opcional)..."
                                    value={tempReview.comment}
                                    onChange={(e) => setTempReview(prev => ({ ...prev, comment: e.target.value }))}
                                />
                                <Button
                                    className="w-full"
                                    onClick={handleSubmitReview}
                                    disabled={tempReview.rating === 0}
                                >
                                    Enviar Calificación
                                </Button>
                            </div>
                        </div>
                    )}

                    {hasReviewed && (
                        <div className="pt-4 text-center">
                            <p className="text-xs font-bold text-emerald-600 bg-emerald-50 py-3 rounded-xl border border-emerald-100">
                                Ya has calificado esta tienda. ¡Gracias por tu opinión!
                            </p>
                        </div>
                    )}

                    {!user && (
                        <div className="pt-4 text-center">
                            <Link to="/login">
                                <Button variant="secondary" className="w-full text-xs font-black uppercase tracking-widest h-12">
                                    Inicia sesión para calificar
                                </Button>
                            </Link>
                        </div>
                    )}

                    <div className="pt-2">
                        <Button
                            variant="secondary"
                            className="w-full h-12 rounded-xl font-bold border-slate-200 text-slate-500"
                            onClick={() => setIsReviewsOpen(false)}
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
