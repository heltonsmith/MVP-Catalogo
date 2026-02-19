import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, MessageCircle, User, Users, Globe, Instagram, Music2, Share2, QrCode, BadgeCheck, Loader2, LayoutDashboard, Eye, Move, Maximize, Save, X, Heart, Pencil, Trash2 } from 'lucide-react';
import QRCode from "react-qr-code";
import { COMPANIES, PRODUCTS, CATEGORIES } from '../../data/mock';
import { DemoProductCard as ProductCard } from '../../components/demo/DemoProductCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StarRating } from '../../components/ui/StarRating';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';

import { useSettings } from '../../hooks/useSettings';
import { useCart } from '../../hooks/useCart';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';
import { cn, formatCurrency } from '../../utils';
import NotFoundPage from '../NotFoundPage';

export default function DemoCatalogPage({ overrideSlug }) {
    const { showToast } = useToast();
    const { user, profile } = useAuth();
    const { setCompanyInfo } = useCart();
    const isDemo = true;
    const { companySlug: paramSlug } = useParams();
    const companySlug = overrideSlug || paramSlug;
    const navigate = useNavigate();
    const location = useLocation();

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
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(1800);
    const [favoriteCount, setFavoriteCount] = useState(500);
    const [followCategory, setFollowCategory] = useState('retail');
    const [hasReviewed, setHasReviewed] = useState(false);
    const [tempReview, setTempReview] = useState({ rating: 0, comment: '' });
    const [editingReview, setEditingReview] = useState(null); // { id, rating, comment }
    const [selectedProductForReviews, setSelectedProductForReviews] = useState(null);
    const [tempProductReview, setTempProductReview] = useState({ rating: 0, comment: '' });
    const [hasReviewedProduct, setHasReviewedProduct] = useState(false);
    const { getSetting } = useSettings();

    const getLimit = () => {
        return 100; // No limits for demo
    };

    const productLimit = getLimit();

    const [isViewOnly, setIsViewOnly] = useState(() => {
        // Initialize from localStorage if present
        const savedMode = localStorage.getItem('demo_view_only');
        return savedMode === 'true'; // Default to false
    });

    useEffect(() => {
        // Persist to localStorage
        localStorage.setItem('demo_view_only', isViewOnly);
        // Dispatch custom event so other components (like navbar) can react if needed
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('demo-view-mode-change', { detail: { isViewOnly } }));
    }, [isViewOnly]);

    const toggleViewOnly = () => {
        setIsViewOnly(!isViewOnly);
    };

    useEffect(() => {
        if (location.hash === '#reviews') {
            setIsReviewsOpen(true);
        }
    }, [location]);

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

                    setCompanyInfo(demoCompany.id, {
                        name: demoCompany.name,
                        slug: demoCompany.slug,
                        whatsapp: demoCompany.whatsapp,
                        logo: demoCompany.logo
                    });

                    setLoading(false);
                    return;
                }

                setCompany(null);
            } catch (error) {
                console.error('Error fetching catalog:', error);
            } finally {
                setLoading(false);
            }
        };

        if (companySlug) {
            fetchCatalogData();
        }
    }, [companySlug]);

    const handleDemoAction = (actionName) => {
        showToast(`Esta es una acción demo: ${actionName}`, "demo");
    };

    const loadStoreMetrics = async () => {
        // No-op for demo
    };

    const toggleFollow = () => {
        handleDemoAction("Seguir Tienda");
    };

    const toggleFavorite = () => {
        handleDemoAction("Guardar en Favoritos");
    };

    const handleSubmitReview = async () => {
        showToast("Esta es una función de demostración. Tu opinión no se guardará en la base de datos.", "info");
        setTempReview({ rating: 0, comment: '' });
    };

    const handleOpenProductReviews = (product) => {
        setSelectedProductForReviews(product);
        setHasReviewedProduct(false);
        setTempProductReview({ rating: 0, comment: '' });
    };

    const handleSubmitProductReview = async () => {
        showToast("Esta es una función de demostración. Tu opinión no se guardará.", "info");
        setTempProductReview({ rating: 0, comment: '' });
    };

    const handleUpdateReview = async () => {
        showToast("Esta es una función de demostración. Los cambios no se guardarán.", "info");
        setEditingReview(null);
        setTempReview({ rating: 0, comment: '' });
    };

    const handleDeleteReview = async (reviewId) => {
        showToast("Esta es una función de demostración. No puedes eliminar reseñas en el modo demo.", "info");
    };

    const startEditReview = (review) => {
        setEditingReview(review);
        setTempReview({ rating: review.rating, comment: review.comment || '' });
        // We need to show the form, which shows when !hasReviewed (usually), 
        // OR we can make the form conditional on editingReview too.
        // Actually the current UI hides the form if hasReviewed is true.
        // We will modify the UI condition to show form if editingReview is present.
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

    const isOwner = false; // Never owner in public demo view

    const DEFAULT_BRANDING = {
        banner: { x: 50, y: 50, zoom: 100 },
        logo: { x: 50, y: 50, zoom: 100 }
    };

    const branding = company?.branding_settings || DEFAULT_BRANDING;

    const handleStartEdit = (type) => {
        showToast("Esta es una función de administrador. Podrás ajustar tu identidad visual en tu panel real.", "info");
    };

    const handleSaveBranding = async () => {
        showToast("Esta es una función de administrador. Los cambios no se guardarán en el modo demo.", "info");
        setEditMode(null);
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
                                    "relative h-14 w-14 sm:h-20 sm:w-20 lg:h-28 lg:w-28 rounded-full bg-white p-1 ring-2 sm:ring-4 ring-white shadow-lg flex-shrink-0 group/logo overflow-hidden",
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
                                {/* Popularity Metrics */}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <button
                                        onClick={toggleFollow}
                                        className={cn(
                                            "flex items-center gap-2 p-1.5 sm:py-1.5 sm:px-4 rounded-xl border backdrop-blur-md transition-all active:scale-95 shadow-lg",
                                            isFollowing
                                                ? "bg-primary-600/30 border-primary-500/50 text-white shadow-primary-500/20"
                                                : "bg-white/10 border-white/10 text-white hover:bg-white/20"
                                        )}
                                        title={isFollowing ? "Dejar de seguir" : "Seguir tienda"}
                                    >
                                        <Users size={14} className={cn("transition-colors", isFollowing ? "text-primary-400" : "text-white/70")} />
                                        <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
                                            {followerCount.toLocaleString()} <span className="hidden lg:inline">{followerCount === 1 ? 'Seguidor' : 'Seguidores'}</span>
                                        </span>
                                    </button>

                                    <button
                                        onClick={toggleFavorite}
                                        className={cn(
                                            "flex items-center gap-2 p-1.5 sm:py-1.5 sm:px-4 rounded-xl border backdrop-blur-md transition-all active:scale-95 shadow-lg",
                                            isFavorite
                                                ? "bg-rose-600/30 border-rose-500/50 text-white shadow-rose-500/20"
                                                : "bg-white/10 border-white/10 text-white hover:bg-white/20"
                                        )}
                                        title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                                    >
                                        <Heart size={14} className={cn("transition-colors", isFavorite ? "text-rose-400 fill-rose-400" : "text-white/70")} />
                                        <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
                                            {favoriteCount.toLocaleString()} <span className="hidden lg:inline">{favoriteCount === 1 ? 'Favorito' : 'Favoritos'}</span>
                                        </span>
                                    </button>

                                    {/* Enviar Mensaje Button */}
                                    <button
                                        onClick={() => {
                                            if (!user) {
                                                navigate('/login?redirectTo=' + encodeURIComponent(location.pathname));
                                            } else {
                                                window.open(`/inbox?chatId=${company.id}`, '_blank');
                                            }
                                        }}
                                        className="flex items-center gap-2 bg-primary-600 p-1.5 sm:py-1.5 sm:px-4 rounded-xl border border-primary-500 shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-95 group/msg"
                                        title="Enviar mensaje"
                                    >
                                        <MessageCircle size={14} className="text-white fill-white/10 group-hover/msg:fill-white/20 transition-all" />
                                        <span className="hidden sm:inline text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                                            Enviar Mensaje
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions Group */}
                        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end border-t border-white/10 pt-3 md:border-0 md:pt-0 overflow-x-auto scrollbar-hide">
                            {/* View Only / Menu Mode Switch for Restaurant */}
                            {companySlug === 'restaurante-delicias' && (
                                <div className="flex-shrink-0 flex items-center gap-1.5 bg-black/20 py-1 px-2.5 rounded-lg border border-white/10 backdrop-blur-md mr-auto md:mr-0">
                                    <span className="text-[10px] font-black text-white/90 uppercase tracking-widest mr-2">
                                        Modo Carta
                                    </span>
                                    <button
                                        onClick={toggleViewOnly}
                                        className={cn(
                                            "w-8 h-4 rounded-full relative transition-colors duration-300 focus:outline-none",
                                            isViewOnly ? "bg-emerald-500" : "bg-slate-600/50"
                                        )}
                                        title={isViewOnly ? "Desactivar Modo Carta" : "Activar Modo Carta"}
                                    >
                                        <div className={cn(
                                            "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm",
                                            isViewOnly ? "translate-x-4" : "translate-x-0"
                                        )} />
                                    </button>
                                </div>
                            )}

                            {/* Demo Admin Link Button */}
                            {(isDemo || company.slug === 'restaurante-delicias' || company.slug === 'tienda-moda') && (
                                <Link to={company.slug === 'restaurante-delicias' ? '/demo/restaurante/dashboard' : '/demo/tienda/dashboard'} className="flex-shrink-0">
                                    <Button variant="secondary" size="sm" className="hidden sm:flex h-8 bg-white/20 border-white/30 text-white hover:bg-white/30 text-[10px] sm:text-xs font-bold gap-1 px-3">
                                        <LayoutDashboard size={14} />
                                        Ver Panel
                                    </Button>
                                </Link>
                            )}

                            <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2">

                                {(company.website || company.socials?.website) && (
                                    <button
                                        onClick={() => handleDemoAction("Ver Web")}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                        title="Sitio Web"
                                    >
                                        <Globe size={16} className="sm:size-18" />
                                    </button>
                                )}
                                {company.socials?.instagram && (
                                    <button
                                        onClick={() => handleDemoAction("Ver Instagram")}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                        title="Instagram"
                                    >
                                        <Instagram size={16} className="sm:size-18" />
                                    </button>
                                )}
                                {company.socials?.tiktok && (
                                    <button
                                        onClick={() => handleDemoAction("Ver TikTok")}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                        title="TikTok"
                                    >
                                        <Music2 size={16} className="sm:size-18" />
                                    </button>
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

                            <div className="h-4 w-px bg-white/20 mx-1 flex-shrink-0" />

                            <div className="flex-shrink-0 flex items-center gap-2">
                                <button
                                    onClick={() => handleDemoAction("Compartir Tienda")}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                    title="Compartir"
                                >
                                    <Share2 size={16} className="sm:size-18" />
                                </button>

                                {company.plan && company.plan !== 'free' && (
                                    <button
                                        onClick={() => setIsQROpen(true)}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                        title="Ver QR de la tienda"
                                    >
                                        <QrCode size={16} className="sm:size-18" />
                                    </button>
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
                                                    cartEnabled={!isViewOnly}
                                                    onReviewClick={() => handleOpenProductReviews(product)}
                                                    viewOnly={isViewOnly}
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
                                            onReviewClick={() => handleOpenProductReviews(product)}
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



            {/* QR Code Modal - Premium only */}
            {
                company?.plan !== 'free' && (
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
                )
            }

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
                                <div key={review.id} className="border border-slate-100 p-5 rounded-2xl hover:bg-slate-50 transition-colors group relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                {review.avatar ? (
                                                    <img src={review.avatar} alt={review.user} className="h-full w-full object-cover" />
                                                ) : review.user && review.user !== 'Anónimo' ? (
                                                    <span className="font-bold text-slate-500 text-lg">{review.user.charAt(0).toUpperCase()}</span>
                                                ) : (
                                                    <User size={20} className="text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 text-sm block">{review.user}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{review.date}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-slate-900 text-white px-2 py-1 rounded-lg text-xs font-black">
                                                {review.rating}
                                            </div>
                                            {/* Edit/Delete Actions for Owner */}
                                            {user && review.user_id === user.id && (
                                                <div className="flex gap-1 ml-2">
                                                    <button
                                                        onClick={() => startEditReview(review)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteReview(review.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
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

                    {/* Show form if user logged in AND (not reviewed yet OR is editing) AND not store owner */}
                    {user && (!hasReviewed || editingReview) && !isOwner ? (
                        <div className="pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-black text-slate-900 mb-4">
                                {editingReview ? 'Editar tu opinión' : 'Deja tu opinión'}
                            </h4>
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
                                    onClick={editingReview ? handleUpdateReview : handleSubmitReview}
                                    disabled={tempReview.rating === 0}
                                >
                                    {editingReview ? 'Actualizar Opinión' : 'Enviar Calificación'}
                                </Button>
                            </div>
                        </div>
                    ) : isOwner ? (
                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-slate-500 font-medium italic">Como dueño de la tienda, no puedes calificar tus propios productos.</p>
                        </div>
                    ) : (hasReviewed && !editingReview) ? (
                        <div className="pt-4 text-center">
                            <p className="text-xs font-bold text-emerald-600 bg-emerald-50 py-3 rounded-xl border border-emerald-100">
                                Ya has calificado esta tienda. ¡Gracias por tu opinión!
                            </p>
                        </div>
                    ) : null}

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

            {/* Product Reviews Modal */}
            <Modal
                isOpen={!!selectedProductForReviews}
                onClose={() => setSelectedProductForReviews(null)}
                title={selectedProductForReviews ? `Opiniones de ${selectedProductForReviews.name}` : 'Opiniones del producto'}
            >
                <div className="space-y-6 p-4 sm:p-6">
                    {selectedProductForReviews && (
                        <>
                            <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-3xl font-bold text-slate-900">{selectedProductForReviews.rating}</p>
                                    <StarRating rating={selectedProductForReviews.rating} count={selectedProductForReviews.reviews?.length} size={14} />
                                </div>
                                <div className="text-right text-xs text-slate-400 font-medium uppercase">
                                    Calificación Promedio
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {selectedProductForReviews.reviews?.length > 0 ? (
                                    selectedProductForReviews.reviews.map(review => (
                                        <div key={review.id} className="border border-slate-100 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {review.avatar ? (
                                                            <img src={review.avatar} alt={review.user} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <User size={18} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 text-sm block">{review.user}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">{review.date}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        {user && review.user_id === user.id && (
                                                            <div className="flex items-center gap-1 mr-1">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingReview(review);
                                                                        setTempProductReview({ rating: review.rating, comment: review.comment });
                                                                        // Scroll to form?
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
                                                                    title="Editar"
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteReview(review.id);
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <StarRating rating={review.rating} size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm italic leading-relaxed pl-12">"{review.comment}"</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-400 italic">
                                        Aún no hay reseñas para este producto.
                                    </div>
                                )}
                            </div>

                            {/* Write Review Section for Product */}
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Pencil size={16} className="text-primary-600" />
                                    Deja tu opinión sobre este producto
                                </h4>

                                {!user ? (
                                    <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-xs text-slate-500 mb-3">Inicia sesión para compartir tu experiencia</p>
                                        <Button size="sm" onClick={() => navigate('/login')} variant="secondary">
                                            Iniciar Sesión
                                        </Button>
                                    </div>
                                ) : (isOwner) ? (
                                    <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center">
                                        <p className="text-xs text-slate-500 font-medium italic">Como dueño de la tienda, no puedes calificar tus propios productos.</p>
                                    </div>
                                ) : (selectedProductForReviews.reviews?.some(r => r.user_id === user.id) || hasReviewedProduct) && !editingReview ? (
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                                        <p className="text-xs text-emerald-700 font-medium">¡Ya has opinado sobre este producto! Gracias.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {editingReview ? 'Actualizar calificación' : 'Tu calificación'}
                                            </span>
                                            <StarRating
                                                interactive
                                                rating={tempProductReview.rating}
                                                size={24}
                                                onRate={(val) => setTempProductReview(prev => ({ ...prev, rating: val }))}
                                            />
                                        </div>

                                        <div className="space-y-3 pt-4">
                                            <div className="flex flex-col gap-1.5 px-1">
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                    {editingReview ? 'Edita tu reseña' : 'Escribe tu reseña'}
                                                </label>
                                                <p className="text-[10px] text-slate-400">Cuéntanos qué te pareció el producto para ayudar a otros clientes.</p>
                                            </div>
                                            <textarea
                                                value={tempProductReview.comment}
                                                onChange={(e) => setTempProductReview(prev => ({ ...prev, comment: e.target.value }))}
                                                className="w-full rounded-2xl border-2 border-slate-100 bg-white focus:bg-white focus:border-primary-500 focus:ring-primary-500 min-h-[120px] text-sm transition-all placeholder:text-slate-350 p-4 shadow-inner"
                                                placeholder="Ej: El producto es excelente, llegó muy rápido y la calidad es increíble..."
                                            />
                                        </div>

                                        <div className="pt-2 flex gap-3">
                                            {editingReview && (
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setEditingReview(null);
                                                        setTempProductReview({ rating: 0, comment: '' });
                                                    }}
                                                    className="flex-1 h-12 rounded-xl text-base font-bold"
                                                >
                                                    Cancelar
                                                </Button>
                                            )}
                                            <Button
                                                onClick={editingReview ? () => {
                                                    showToast("Esta es una función de demostración. Los cambios no se guardarán.", "info");
                                                    setEditingReview(null);
                                                    setTempProductReview({ rating: 0, comment: '' });
                                                } : handleSubmitProductReview}
                                                disabled={tempProductReview.rating === 0}
                                                className="flex-[2] h-12 rounded-xl text-base font-bold shadow-lg shadow-primary-200/50"
                                            >
                                                {editingReview ? 'Guardar Cambios' : 'Publicar mi Opinión'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2">
                                <Button
                                    variant="primary"
                                    className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary-200/50"
                                    onClick={() => setSelectedProductForReviews(null)}
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
            {/* Follow categorization modal removed per user request */}
        </div>
    );
}
