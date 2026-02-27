import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, MessageCircle, User, Users, Globe, Instagram, Music2, Share2, QrCode, BadgeCheck, Loader2, LayoutDashboard, Eye, Move, Maximize, Save, X, Heart, Pencil, Trash2 } from 'lucide-react';
import QRCode from "react-qr-code";
import { supabase } from '../lib/supabase';
import { COMPANIES, PRODUCTS, CATEGORIES } from '../data/mock';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StarRating } from '../components/ui/StarRating';
import { Modal } from '../components/ui/Modal';
import { MailboxPreview } from '../components/chat/MailboxPreview';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useCart } from '../hooks/useCart';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import { cn, formatCurrency } from '../utils';
import NotFoundPage from './NotFoundPage';
import { SEO } from '../components/layout/SEO';

export default function CatalogPage() {
    const { showToast } = useToast();
    const { user, profile, refreshCompany } = useAuth();
    const { getCart, setCompanyInfo } = useCart();
    const [searchParams] = useSearchParams();
    const { companySlug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [company, setCompany] = useState(null);
    const currentCart = company?.id ? getCart(company.id) : [];
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
    const [followerCount, setFollowerCount] = useState(0);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [followCategory, setFollowCategory] = useState('retail');
    const [hasReviewed, setHasReviewed] = useState(false);
    const [tempReview, setTempReview] = useState({ rating: 0, comment: '' });
    const [editingReview, setEditingReview] = useState(null); // { id, rating, comment }
    const [selectedProductForReviews, setSelectedProductForReviews] = useState(null);
    const [tempProductReview, setTempProductReview] = useState({ rating: 0, comment: '' });
    const [hasReviewedProduct, setHasReviewedProduct] = useState(false);
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
        if (location.hash === '#reviews') {
            setIsReviewsOpen(true);
        }
    }, [location]);

    useEffect(() => {
        const fetchCatalogData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Company
                const { data: companyData, error: companyError } = await supabase

                    .from('companies')
                    .select('*')
                    .eq('slug', companySlug)
                    .single();

                if (companyError || !companyData) {
                    throw new Error('Company not found');
                }

                // 2. Fetch Products with new schema
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
                    .eq('active', true);

                if (productsError) throw productsError;

                const productIds = (productsData || []).map(p => p.id);

                // 3. Fetch Reviews for real rating (Store reviews + Product reviews linked to company)
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select('id, rating, comment, customer_name, user_id, product_id, created_at')
                    .or(`company_id.eq.${companyData.id}${productIds.length > 0 ? `,product_id.in.(${productIds.join(',')})` : ''}`)
                    .order('created_at', { ascending: false });

                // 3. Fetch avatars manually to avoid FK issues
                let avatarsMap = {};
                if (reviewsData && reviewsData.length > 0) {
                    const userIds = [...new Set(reviewsData.map(r => r.user_id).filter(Boolean))];
                    if (userIds.length > 0) {
                        const { data: profilesData } = await supabase
                            .from('profiles')
                            .select('id, avatar_url')
                            .in('id', userIds);

                        if (profilesData) {
                            profilesData.forEach(p => {
                                avatarsMap[p.id] = p.avatar_url;
                            });
                        }
                    }
                }

                const storeReviews = (reviewsData || []).filter(r => !r.product_id);

                const realRating = storeReviews.length > 0
                    ? parseFloat((storeReviews.reduce((acc, r) => acc + r.rating, 0) / storeReviews.length).toFixed(1))
                    : 0;

                const mappedReviews = storeReviews.map(r => ({
                    id: r.id,
                    user: r.customer_name || 'Anónimo',
                    user_id: r.user_id,
                    avatar: avatarsMap[r.user_id],
                    date: new Date(r.created_at).toLocaleDateString(),
                    rating: r.rating,
                    comment: r.comment || ''
                }));

                const fullCompany = {
                    ...companyData,
                    rating: realRating,
                    reviews: mappedReviews
                };
                setCompany(fullCompany);

                // Store company info in cart context for CartPage resolution
                setCompanyInfo(companyData.id, {
                    name: companyData.name,
                    slug: companyData.slug,
                    whatsapp: companyData.whatsapp,
                    logo: companyData.logo,
                    user_id: companyData.user_id,
                    whatsapp_enabled: companyData.whatsapp_enabled,
                    plan: companyData.plan,
                    landing_enabled: companyData.landing_enabled
                });

                // Transform products to include categories array, images, and ratings
                const transformedProducts = await Promise.all((productsData || []).map(async product => {
                    // Filter reviews for this specific product from the already fetched reviewsData
                    const productReviewData = (reviewsData || []).filter(r => r.product_id === product.id);
                    // Fetch avatars for product reviews if not already in avatarsMap
                    const productUserIds = [...new Set(productReviewData.map(r => r.user_id).filter(Boolean))];
                    const newUserIds = productUserIds.filter(id => !avatarsMap[id]);

                    if (newUserIds.length > 0) {
                        const { data: profilesData } = await supabase
                            .from('profiles')
                            .select('id, avatar_url')
                            .in('id', newUserIds);

                        if (profilesData) {
                            profilesData.forEach(p => {
                                avatarsMap[p.id] = p.avatar_url;
                            });
                        }
                    }

                    const productReviews = productReviewData.map(r => ({
                        id: r.id,
                        user: r.customer_name || 'Anónimo',
                        user_id: r.user_id,
                        avatar: avatarsMap[r.user_id],
                        date: new Date(r.created_at).toLocaleDateString(),
                        rating: r.rating,
                        comment: r.comment || ''
                    }));

                    const avgRating = productReviews.length > 0
                        ? parseFloat((productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length).toFixed(1))
                        : 0;

                    return {
                        ...product,
                        categories: product.product_categories?.map(pc => pc.categories) || [],
                        images: product.product_images?.sort((a, b) => a.display_order - b.display_order).map(img => img.image_url) || [],
                        reviews: productReviews,
                        rating: avgRating
                    };
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
                    // Also log individual visit for period-based analytics
                    await supabase.from('store_visits').insert({ company_id: company.id });
                } catch (error) {
                    console.error('Error tracking view:', error);
                    // Fail silently - don't block user experience
                }
            }
        };

        trackView();
    }, [company?.id]);


    // Load general metrics for everyone
    useEffect(() => {
        if (company) {
            loadStoreMetrics();
        }
    }, [company?.id]);

    // Load user-specific state
    useEffect(() => {
        if (user && company) {
            checkIfFavorite();
            checkIfFollowing();
            checkIfReviewed();
        }
    }, [user, company?.id]);

    const loadStoreMetrics = async () => {
        try {
            const [follows, favs] = await Promise.all([
                supabase.from('store_follows').select('id', { count: 'exact' }).eq('company_id', company.id),
                supabase.from('favorites').select('id', { count: 'exact' }).eq('company_id', company.id)
            ]);
            setFollowerCount(follows.count || 0);
            setFavoriteCount(favs.count || 0);
        } catch (error) {
            console.error('Error loading store metrics:', error);
        }
    };

    const checkIfFavorite = async () => {
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('company_id', company.id)
                .maybeSingle();

            setIsFavorite(!!data);
        } catch (error) {
            console.error('Error checking favorite:', error);
        }
    };

    const checkIfFollowing = async () => {
        try {
            const { data } = await supabase
                .from('store_follows')
                .select('id, category')
                .eq('user_id', user.id)
                .eq('company_id', company.id)
                .maybeSingle();

            setIsFollowing(!!data);
            if (data) setFollowCategory(data.category);
        } catch (error) {
            console.error('Error checking follow:', error);
        }
    };


    const toggleFollow = async () => {
        const category = company?.business_type || 'retail';
        if (!user) {
            showToast("Debes iniciar sesión para usar esta función", "info");
            return;
        }

        if (isOwner) {
            showToast("No puedes seguirte a ti mismo", "warning");
            return;
        }

        try {
            if (isFollowing) {
                await supabase
                    .from('store_follows')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('company_id', company.id);
                setIsFollowing(false);
                showToast("Ya no sigues esta tienda", "success");
            } else {
                await supabase
                    .from('store_follows')
                    .insert([{
                        user_id: user.id,
                        company_id: company.id,
                        category: category
                    }]);
                setIsFollowing(true);
                setFollowCategory(category);
                showToast("¡Ahora sigues a esta tienda!", "success");

                // Send notification to store owner if enabled
                if (company.user_id) {
                    const prefs = company.notification_prefs || {};
                    if (prefs.notify_follow !== false) {
                        const customerName = profile?.full_name || user.email?.split('@')[0] || 'Un cliente';
                        await supabase.from('notifications').insert([{
                            user_id: company.user_id,
                            type: 'follow',
                            title: 'Nuevo seguidor',
                            content: `${customerName} ha comenzado a seguir tu tienda.`,
                            metadata: { follower_id: user.id, follower_name: customerName, company_id: company.id }
                        }]);
                    }
                }
            }
            loadStoreMetrics();
        } catch (error) {
            console.error('Error toggling follow:', error);
            showToast("Error al procesar solicitud", "error");
        }
    };

    const checkIfReviewed = async () => {
        try {
            const { data } = await supabase
                .from('reviews')
                .select('id')
                .eq('user_id', user.id)
                .eq('company_id', company.id)
                .is('product_id', null)
                .maybeSingle();

            setHasReviewed(!!data);
        } catch (error) {
            console.error('Error checking review:', error);
        }
    };

    const toggleFavorite = async () => {
        if (!user) {
            showToast("Debes iniciar sesión para usar esta función", "info");
            return;
        }

        if (isOwner || profile?.role === 'owner') {
            showToast("No puedes guardar tiendas en favoritos si eres dueño de una tienda", "warning");
            return;
        }

        try {
            if (isFavorite) {
                await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('company_id', company.id);
                setIsFavorite(false);
                showToast("Eliminado de favoritos", "success");
            } else {
                await supabase
                    .from('favorites')
                    .insert([{
                        user_id: user.id,
                        company_id: company.id,
                        type: company.business_type || 'retail'
                    }]);
                setIsFavorite(true);
                showToast("¡Guardado en favoritos!", "success");
            }
            loadStoreMetrics();
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
            const newReview = {
                user_id: user.id,
                company_id: company.id,
                rating: tempReview.rating,
                comment: tempReview.comment,
                customer_name: profile?.full_name || user.user_metadata?.full_name || 'Anónimo',
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('reviews')
                .insert([newReview])
                .select()
                .single();

            if (error) throw error;

            showToast("¡Gracias por tu opinión!", "success");
            setHasReviewed(true);
            setTempReview({ rating: 0, comment: '' });

            // Real-time update
            setCompany(prev => {
                const updatedReviews = [
                    {
                        id: data.id,
                        user: newReview.customer_name,
                        user_id: user.id,
                        date: new Date().toLocaleDateString(),
                        rating: newReview.rating,
                        comment: newReview.comment
                    },
                    ...(prev.reviews || [])
                ];

                const newRating = parseFloat((updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(1));

                return {
                    ...prev,
                    reviews: updatedReviews,
                    rating: newRating
                };
            });
        } catch (error) {
            console.error('Error submitting review:', error);
            showToast("Error al enviar calificación", "error");
        }
    };

    const handleOpenProductReviews = async (product) => {
        setSelectedProductForReviews(product);
        setHasReviewedProduct(false);
        setTempProductReview({ rating: 0, comment: '' });

        // Check if user already reviewed THIS product
        if (user) {
            try {
                const { data } = await supabase
                    .from('reviews')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('product_id', product.id)
                    .maybeSingle();

                if (data) setHasReviewedProduct(true);
            } catch (e) {
                console.error("Error checking product review", e);
            }
        }
    };

    const handleSubmitProductReview = async () => {
        if (!user) {
            showToast("Debes iniciar sesión para opinar", "error");
            return;
        }

        if (tempProductReview.rating === 0) {
            showToast("Por favor selecciona una calificación", "warning");
            return;
        }

        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    company_id: company.id,
                    product_id: selectedProductForReviews.id,
                    user_id: user.id,
                    customer_name: profile?.full_name || user.email.split('@')[0],
                    rating: tempProductReview.rating,
                    comment: tempProductReview.comment.slice(0, 150)
                });

            if (error) throw error;

            showToast("¡Gracias por tu opinión!", "success");
            setTempProductReview({ rating: 0, comment: '' });
            setHasReviewedProduct(true);

            // Optimistically update local products state
            const newReview = {
                id: Math.random().toString(), // Temp ID
                user: profile?.full_name || user.email.split('@')[0],
                user_id: user.id,
                avatar: profile?.avatar_url,
                date: new Date().toLocaleDateString(),
                rating: tempProductReview.rating,
                comment: tempProductReview.comment
            };

            setProducts(prevProducts => prevProducts.map(p => {
                if (p.id === selectedProductForReviews.id) {
                    const newReviews = [newReview, ...(p.reviews || [])];
                    const newRating = parseFloat((newReviews.reduce((acc, r) => acc + r.rating, 0) / newReviews.length).toFixed(1));
                    return { ...p, reviews: newReviews, rating: newRating };
                }
                return p;
            }));

            // Also update the selected product for the modal display
            setSelectedProductForReviews(prev => {
                if (!prev) return null;
                const newReviews = [newReview, ...(prev.reviews || [])];
                const newRating = parseFloat((newReviews.reduce((acc, r) => acc + r.rating, 0) / newReviews.length).toFixed(1));
                return { ...prev, reviews: newReviews, rating: newRating };
            });

        } catch (error) {
            console.error('Error submitting product review:', error);
            showToast("No se pudo enviar la reseña", "error");
        }
    };

    const handleUpdateReview = async () => {
        if (!user || !editingReview) return;

        try {
            let query = supabase.from('reviews').update({
                rating: tempReview.rating,
                comment: tempReview.comment.slice(0, 150),
                customer_name: profile?.full_name || user.user_metadata?.full_name || 'Anónimo',
                created_at: new Date().toISOString()
            }).eq('id', editingReview.id);

            // Admin bypass of user_id check
            if (profile?.role !== 'admin') {
                query = query.eq('user_id', user.id);
            }

            const { error } = await query;

            if (error) throw error;

            showToast("¡Reseña actualizada!", "success");

            // Update local state
            setCompany(prev => {
                const updatedReviews = prev.reviews.map(r =>
                    r.id === editingReview.id
                        ? { ...r, rating: tempReview.rating, comment: tempReview.comment.slice(0, 150), user: profile?.full_name || user.user_metadata?.full_name || r.user }
                        : r
                );

                const newRating = parseFloat((updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(1));

                return {
                    ...prev,
                    reviews: updatedReviews,
                    rating: newRating
                };
            });

            setEditingReview(null);
            setTempReview({ rating: 0, comment: '' });
            // Keep hasReviewed as true
        } catch (error) {
            console.error('Error updating review:', error);
            showToast("Error al actualizar", "error");
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar tu reseña?')) return;

        try {
            let query = supabase.from('reviews').delete().eq('id', reviewId);

            // Admin bypass of user_id check
            if (profile?.role !== 'admin') {
                query = query.eq('user_id', user.id);
            }

            const { error } = await query;

            if (error) throw error;

            showToast("Reseña eliminada", "success");

            // Update modal state if open (Product Reviews)
            if (selectedProductForReviews) {
                setSelectedProductForReviews(prev => {
                    if (!prev) return null;
                    const newReviews = (prev.reviews || []).filter(r => r.id !== reviewId);
                    const newRating = newReviews.length > 0
                        ? parseFloat((newReviews.reduce((acc, r) => acc + r.rating, 0) / newReviews.length).toFixed(1))
                        : 0;
                    return { ...prev, reviews: newReviews, rating: newRating };
                });
                setHasReviewedProduct(false);
            } else {
                // If no selected product, it was likely a store review
                setHasReviewed(false);
                // Real-time update for store reviews
                setCompany(prev => {
                    const updatedReviews = (prev.reviews || []).filter(r => r.id !== reviewId);
                    const newRating = updatedReviews.length > 0
                        ? parseFloat((updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(1))
                        : 0;
                    return { ...prev, reviews: updatedReviews, rating: newRating };
                });
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            showToast("Error al eliminar", "error");
        }
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

    const isOwner = user?.id === company?.user_id;

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
            <SEO
                title={company?.name || "Catálogo"}
                description={company?.description || `Explora el catálogo de productos de ${company?.name} en Ktaloog.com. Encuentra los mejores precios y haz tu pedido por WhatsApp.`}
                image={company?.logo || company?.banner}
                url={`https://www.ktaloog.com/catalogo/${companySlug}`}
                type="profile"
            />
            {/* Company Header */}
            <div
                ref={editMode === 'banner' ? containerRef : null}
                className={cn(
                    "relative min-h-[14rem] w-full bg-slate-900 lg:min-h-[16rem] group/banner flex flex-col justify-center",
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
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300"
                        style={{
                            objectPosition: editMode === 'banner'
                                ? `${tempSettings.banner.x}% ${tempSettings.banner.y}%`
                                : `${branding.banner?.x ?? 50}% ${branding.banner?.y ?? 50}%`,
                            transform: `scale(${(editMode === 'banner' ? tempSettings.banner.zoom : (branding.banner?.zoom ?? 100)) / 100})`,
                            opacity: editMode === 'banner' ? 1 : 0.6
                        }}
                    />
                ) : (
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />
                )}

                {/* Banner Overlay Controls */}
                {isOwner && !editMode && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity bg-black/20 pointer-events-none z-10">
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

                <div className="relative z-10 w-full px-4 pt-24 pb-4 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent text-white pointer-events-none">
                    <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pointer-events-auto">
                        {/* Shop Info Group */}
                        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 w-full md:w-auto">
                            <div
                                ref={editMode === 'logo' ? containerRef : null}
                                className={cn(
                                    "relative mt-2 sm:mt-0 h-14 w-14 sm:h-20 sm:w-20 lg:h-28 lg:w-28 rounded-full bg-white p-1 ring-2 sm:ring-4 ring-white shadow-lg flex-shrink-0 group/logo overflow-hidden",
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
                                    {company.plan === 'pro' && (
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
                                <div className="flex flex-wrap items-center gap-4 sm:gap-2 mt-4">
                                    <div className="flex flex-col items-center gap-1">
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
                                        <span className="text-[9px] font-bold text-white uppercase tracking-tight sm:hidden pointer-events-none">
                                            {isFollowing ? 'Siguiendo' : 'Seguir'}
                                        </span>
                                    </div>

                                    {(!isOwner && profile?.role !== 'owner') && (
                                        <div className="flex flex-col items-center gap-1">
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
                                            <span className="text-[9px] font-bold text-white uppercase tracking-tight sm:hidden pointer-events-none">
                                                Favorito
                                            </span>
                                        </div>
                                    )}

                                    {/* Enviar Mensaje Button */}
                                    <div className="flex flex-col items-center gap-1">
                                        <button
                                            onClick={() => {
                                                if (!user) {
                                                    navigate('/login?redirectTo=' + encodeURIComponent(location.pathname));
                                                } else if (isOwner) {
                                                    showToast("No puedes enviarte mensajes a ti mismo", "warning");
                                                } else {
                                                    // 1. Track quote analytics for EACH product in the cart
                                                    const trackProductQuotes = async () => {
                                                        if (company && company.id && !company.slug?.includes('demo')) {
                                                            const uniqueProductIds = [...new Set((cart || []).map(item => item.id))];
                                                            for (const pid of uniqueProductIds) {
                                                                try {
                                                                    await supabase.rpc('increment_product_quote', { product_id: pid });
                                                                } catch (e) {
                                                                    console.error(`Error tracking quote for product ${pid}:`, e);
                                                                }
                                                            }
                                                        }
                                                    };
                                                    trackProductQuotes();

                                                    // 2. Open Internal Inbox instead of WhatsApp
                                                    navigate(`/inbox?new_chat=${company.id}`);
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
                                        <span className="text-[9px] font-bold text-white uppercase tracking-tight sm:hidden pointer-events-none">
                                            Mensaje
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Group */}
                        <div className="flex items-center w-full md:w-auto justify-between md:justify-end border-t border-white/10 pt-4 md:border-0 md:pt-0">
                            <div className="flex items-center gap-3 sm:gap-2">
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

                            <div className="flex items-center">
                                <div className="h-4 w-px bg-white/20 mx-3 md:mx-1" />

                                <div className="flex items-center gap-3 sm:gap-2">
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

                                    {/* Cart Button Floating - Hide if menu mode */}
                                    {!isOwner && currentCart.length > 0 && !company?.menu_mode && (
                                        <Link
                                            to="/carrito"
                                            className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white rounded-xl shadow-[0_10px_30px_rgba(5,145,100,0.3)] p-2 pr-4 flex items-center gap-3 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 animate-in slide-in-from-right-12"
                                        >
                                            <div className="bg-rose-500 text-white text-xs font-black h-7 w-7 rounded-lg flex items-center justify-center shadow-sm shrink-0 border border-white/20">
                                                {currentCart.length}
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-[9px] font-bold uppercase tracking-wider opacity-80 leading-tight mb-0.5">Ver Carrito</p>
                                                <p className="font-black text-xs uppercase tracking-tight leading-tight">Cotizar Ahora</p>
                                            </div>
                                        </Link>
                                    )}
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
                    {company?.menu_mode ? (
                        // Restaurant Layout: Grouped by Category, View Only, No Cart
                        <div className="space-y-16">
                            {categories.map(category => {
                                const categoryProducts = filteredProducts.filter(p =>
                                    p.product_categories?.some(pc =>
                                        pc.category_id === category.id || pc.categories?.id === category.id
                                    )
                                );
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
                                                    isDemo={company.slug?.includes('demo')}
                                                    cartEnabled={false} // Force cart disabled in menu mode
                                                    onReviewClick={() => handleOpenProductReviews(product)}
                                                    isOwner={isOwner}
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
                                            cartEnabled={!company?.menu_mode} // Use company setting
                                            onReviewClick={() => handleOpenProductReviews(product)}
                                            isOwner={isOwner}
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
                                            {user && (review.user_id === user.id || profile?.role === 'admin') && (
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
                                    <p className="text-slate-600 text-sm italic leading-relaxed break-words">"{review.comment}"</p>
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
                                <div className="relative">
                                    <textarea
                                        className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-all resize-none min-h-[100px]"
                                        placeholder="Cuéntanos tu experiencia (opcional)..."
                                        value={tempReview.comment}
                                        onChange={(e) => setTempReview(prev => ({ ...prev, comment: e.target.value.slice(0, 150) }))}
                                        maxLength={150}
                                    />
                                    <div className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-400">
                                        {tempReview.comment?.length || 0}/150
                                    </div>
                                </div>
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
                            {/* Option to re-edit if they want, though simpler to use the button on the card */}
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
                                                        {user && (review.user_id === user.id || profile?.role === 'admin') && (
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
                                            <p className="text-slate-600 text-sm italic leading-relaxed pl-12 break-words">"{review.comment}"</p>
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
                                            <div className="relative">
                                                <textarea
                                                    value={tempProductReview.comment}
                                                    onChange={(e) => setTempProductReview(prev => ({ ...prev, comment: e.target.value.slice(0, 150) }))}
                                                    maxLength={150}
                                                    className="w-full rounded-2xl border-2 border-slate-100 bg-white focus:bg-white focus:border-primary-500 focus:ring-primary-500 min-h-[120px] text-sm transition-all placeholder:text-slate-350 p-4 shadow-inner resize-none h-auto"
                                                    placeholder="Ej: El producto es excelente, llegó muy rápido y la calidad es increíble..."
                                                />
                                                <div className="absolute bottom-3 right-4 text-[10px] font-bold text-slate-400">
                                                    {tempProductReview.comment?.length || 0}/150
                                                </div>
                                            </div>
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
                                                onClick={editingReview ? async () => {
                                                    try {
                                                        let query = supabase.from('reviews').update({
                                                            rating: tempProductReview.rating,
                                                            comment: tempProductReview.comment.slice(0, 150),
                                                            created_at: new Date().toISOString()
                                                        }).eq('id', editingReview.id);

                                                        if (profile?.role !== 'admin') {
                                                            query = query.eq('user_id', user.id);
                                                        }

                                                        const { error } = await query;

                                                        if (error) throw error;
                                                        showToast("¡Reseña actualizada!", "success");

                                                        // Update local products state
                                                        setProducts(prevProducts => prevProducts.map(p => {
                                                            if (p.id === selectedProductForReviews.id) {
                                                                const newReviews = p.reviews.map(r => r.id === editingReview.id ? { ...r, rating: tempProductReview.rating, comment: tempProductReview.comment.slice(0, 150), user: profile?.full_name || user.user_metadata?.full_name || r.user } : r);
                                                                const newRating = parseFloat((newReviews.reduce((acc, r) => acc + r.rating, 0) / newReviews.length).toFixed(1));
                                                                return { ...p, reviews: newReviews, rating: newRating };
                                                            }
                                                            return p;
                                                        }));

                                                        // Update modal state
                                                        setSelectedProductForReviews(prev => {
                                                            const newReviews = prev.reviews.map(r => r.id === editingReview.id ? { ...r, rating: tempProductReview.rating, comment: tempProductReview.comment.slice(0, 150), user: profile?.full_name || user.user_metadata?.full_name || r.user } : r);
                                                            const newRating = parseFloat((newReviews.reduce((acc, r) => acc + r.rating, 0) / newReviews.length).toFixed(1));
                                                            return { ...prev, reviews: newReviews, rating: newRating };
                                                        });

                                                        setEditingReview(null);
                                                        setTempProductReview({ rating: 0, comment: '' });
                                                    } catch (error) {
                                                        console.error('Error updating product review:', error);
                                                        showToast("Error al actualizar", "error");
                                                    }
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
        </div >
    );
}
