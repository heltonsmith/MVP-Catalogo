import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, ShieldOff, Eye, ExternalLink, AlertTriangle, Calendar, Clock, Users, ChevronLeft, ChevronRight, Edit2, Loader2, Store, Zap, Sparkles, X, BadgeCheck, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils';
import { Tooltip } from '../../components/ui/Tooltip';
import { useAuth } from '../../context/AuthContext';

const PAGE_SIZE = 20;

const BUSINESS_TYPE_LABELS = {
    retail: 'Minorista',
    wholesale: 'Mayorista',
    mixed: 'Mayorista y Detalle',
    restaurant: 'Restaurante'
};

// ─── Super Admin Edit Modal ─────────────────────────────────────────────────
function UserEditModal({ item, type, onClose, onSave }) {
    const [formData, setFormData] = useState(type === 'store' ? {
        name: item.name || '',
        slug: item.slug || '',
        plan: item.plan || 'free',
        business_type: item.business_type || 'retail',
        menu_mode: item.menu_mode || false,
        full_name: item.profiles?.full_name || '',
        email: item.profiles?.email || ''
    } : {
        full_name: item.full_name || '',
        email: item.email || '',
        role: item.role || 'user',
        status: item.status || 'active',
        avatar_url: item.avatar_url || ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (type === 'store') {
                const { error: compErr } = await supabase
                    .from('companies')
                    .update({
                        name: formData.name,
                        slug: formData.slug,
                        plan: formData.plan,
                        business_type: formData.business_type,
                        menu_mode: formData.menu_mode
                    })
                    .eq('id', item.id);
                if (compErr) throw compErr;

                if (item.user_id) {
                    const { error: profErr } = await supabase
                        .from('profiles')
                        .update({ full_name: formData.full_name })
                        .eq('id', item.user_id);
                    if (profErr) throw profErr;
                }
            } else {
                const { error: profErr } = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.full_name,
                        role: formData.role,
                        status: formData.status,
                        avatar_url: formData.avatar_url || null
                    })
                    .eq('id', item.id);
                if (profErr) throw profErr;
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-slate-900">Editar {type === 'store' ? 'Tienda' : 'Usuario'}</h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X size={20} /></Button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {type === 'store' ? (
                            <>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nombre Tienda</label>
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="rounded-xl h-11" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Slug</label>
                                        <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="rounded-xl h-11" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Plan</label>
                                        <select value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value })} className="w-full rounded-xl bg-slate-50 h-11 px-3 text-sm font-bold border-none outline-none">
                                            <option value="free">FREE</option>
                                            <option value="plus">PLUS</option>
                                            <option value="pro">PRO</option>
                                            <option value="custom">CUSTOM</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Tipo de Negocio</label>
                                        <select value={formData.business_type} onChange={e => setFormData({ ...formData, business_type: e.target.value })} className="w-full rounded-xl bg-slate-50 h-11 px-3 text-sm font-bold border-none outline-none">
                                            <option value="retail">Minorista</option>
                                            <option value="wholesale">Mayorista</option>
                                            <option value="mixed">Mayorista y Detalle</option>
                                            <option value="restaurant">Restaurante</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end pb-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={formData.menu_mode} onChange={e => setFormData({ ...formData, menu_mode: e.target.checked })} className="h-5 w-5 rounded-lg border-slate-300 text-primary-500 focus:ring-primary-500" />
                                            <span className="text-sm font-bold text-slate-700">Modo Carta</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nombre del Dueño</label>
                                    <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="rounded-xl h-11" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nombre Completo</label>
                                    <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="rounded-xl h-11" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Email</label>
                                    <Input value={formData.email} disabled className="rounded-xl h-11 bg-slate-100 text-slate-500 cursor-not-allowed" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Rol</label>
                                        <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full rounded-xl bg-slate-50 h-11 px-3 text-sm font-bold border-none outline-none">
                                            <option value="user">Cliente</option>
                                            <option value="owner">Dueño de Tienda</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Estado</label>
                                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full rounded-xl bg-slate-50 h-11 px-3 text-sm font-bold border-none outline-none">
                                            <option value="active">Activo</option>
                                            <option value="blocked">Bloqueado</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Avatar URL</label>
                                    <Input value={formData.avatar_url} onChange={e => setFormData({ ...formData, avatar_url: e.target.value })} className="rounded-xl h-11" placeholder="https://..." />
                                </div>
                            </>
                        )}
                        <div className="pt-4 flex gap-3">
                            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold">Cancelar</Button>
                            <Button type="submit" disabled={saving} className="flex-1 h-12 rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800">
                                {saving ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AdminUsers() {
    const { showToast } = useToast();
    const { startObserving, startObservingUser } = useAuth();
    const navigate = useNavigate();

    // UI State
    const [activeTab, setActiveTab] = useState('stores');
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');

    // Data State
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);

    // Action State
    const [actionId, setActionId] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [editingRenewal, setEditingRenewal] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);

    // ─── Data Fetching ──────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const start = page * PAGE_SIZE;
            const end = start + PAGE_SIZE - 1;

            if (activeTab === 'stores') {
                // Optionally pre-search profiles by email
                let userIdsFromSearch = [];
                if (appliedSearch) {
                    const { data: matchedProfiles } = await supabase
                        .from('profiles')
                        .select('id')
                        .or(`email.ilike.%${appliedSearch}%,full_name.ilike.%${appliedSearch}%`);
                    if (matchedProfiles && matchedProfiles.length > 0) {
                        userIdsFromSearch = matchedProfiles.map(p => p.id);
                    }
                }

                let query = supabase
                    .from('companies')
                    .select('*', { count: 'exact' })
                    .not('name', 'in', '("Demo Tienda","Demo Restaurante")')
                    .order('created_at', { ascending: false })
                    .range(start, end);

                if (appliedSearch) {
                    const cond = `name.ilike.%${appliedSearch}%,slug.ilike.%${appliedSearch}%`;
                    if (userIdsFromSearch.length > 0) {
                        query = query.or(`${cond},user_id.in.(${userIdsFromSearch.join(',')})`);
                    } else {
                        query = query.or(cond);
                    }
                }

                const { data: companies, count, error } = await query;
                if (error) throw error;

                // Fetch profiles for merged data
                if (companies && companies.length > 0) {
                    const userIds = [...new Set(companies.map(c => c.user_id).filter(Boolean))];
                    if (userIds.length > 0) {
                        const { data: profiles } = await supabase
                            .from('profiles')
                            .select('id, email, full_name, status')
                            .in('id', userIds);
                        const merged = companies.map(comp => ({
                            ...comp,
                            profiles: profiles?.find(p => p.id === comp.user_id) || null
                        }));
                        setItems(merged);
                    } else {
                        setItems(companies);
                    }
                } else {
                    setItems([]);
                }
                setTotalCount(count || 0);
            } else {
                // Customers tab
                let query = supabase
                    .from('profiles')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(start, end);

                if (appliedSearch) {
                    query = query.or(`full_name.ilike.%${appliedSearch}%,email.ilike.%${appliedSearch}%`);
                }

                const { data, count, error } = await query;
                if (error) throw error;

                // For each customer who is an owner, fetch their company for observer mode
                if (data && data.length > 0) {
                    const ownerIds = data.filter(p => p.role === 'owner').map(p => p.id);
                    let companiesMap = {};
                    if (ownerIds.length > 0) {
                        const { data: ownerCompanies } = await supabase
                            .from('companies')
                            .select('id, name, slug, logo, user_id')
                            .in('user_id', ownerIds);
                        if (ownerCompanies) {
                            ownerCompanies.forEach(c => { companiesMap[c.user_id] = c; });
                        }
                    }
                    setItems(data.map(p => ({ ...p, company: companiesMap[p.id] || null })));
                } else {
                    setItems([]);
                }
                setTotalCount(count || 0);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast("Error al cargar la lista", "error");
        } finally {
            setLoading(false);
        }
    }, [activeTab, page, appliedSearch, showToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        setAppliedSearch(search);
    };

    // ─── Actions ────────────────────────────────────────────────────────
    const toggleBlockUser = async (user) => {
        const userId = user.user_id || user.id;
        const currentStatus = user.profiles?.status || user.status;
        const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
        setActionId(userId);
        try {
            const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
            if (error) throw error;
            showToast(`Usuario ${newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'}.`, 'info');
            fetchData();
        } catch { showToast("Error al cambiar estado", "error"); }
        finally { setActionId(null); }
    };

    const deleteStorageFolder = async (bucket, folderPath) => {
        try {
            const { data: files, error: listError } = await supabase.storage
                .from(bucket)
                .list(folderPath);

            if (listError) return; // Silent fail if no files
            if (files && files.length > 0) {
                const filesToDelete = files.map(file => `${folderPath}/${file.name}`);
                await supabase.storage.from(bucket).remove(filesToDelete);
            }
        } catch (error) {
            console.error(`Error deleting storage folder ${bucket}/${folderPath}:`, error);
        }
    };

    const handleDelete = async () => {
        if (!deletingItem) return;
        const targetId = deletingItem.id;
        const type = deletingItem.type; // 'store' or 'user'
        setActionId(targetId);
        try {
            if (type === 'store') {
                // 1. Cleanup storage
                await deleteStorageFolder('product-images', targetId);
                // 2. RPC Delete
                const { error } = await supabase.rpc('admin_delete_company', { target_company_id: targetId });
                if (error) throw error;
                showToast("Tienda eliminada correctamente", "success");
            } else {
                // 1. Cleanup storage
                await deleteStorageFolder('avatars', targetId);
                await deleteStorageFolder('store-assets', targetId);
                if (deletingItem.company?.id) {
                    await deleteStorageFolder('product-images', deletingItem.company.id);
                }
                // 2. RPC Delete
                const { error } = await supabase.rpc('admin_delete_user', { target_user_id: targetId });
                if (error) throw error;
                showToast("Usuario eliminado correctamente", "success");
            }
            fetchData();
            setDeletingItem(null);
        } catch (error) {
            console.error('Delete error:', error);
            showToast(error.message || "Error al eliminar", "error");
        } finally {
            setActionId(null);
        }
    };


    const updateRenewalDate = async (company, newDate) => {
        setActionId(company.id);
        try {
            const { error } = await supabase.from('companies')
                .update({ renewal_date: newDate, last_notified_renewal_date: null })
                .eq('id', company.id);
            if (error) throw error;
            showToast('Suscripción actualizada', 'success');
            fetchData();
            setEditingRenewal(null);
        } catch { showToast("Error al actualizar fecha", "error"); }
        finally { setActionId(null); }
    };

    const setRenewalPreset = (company, type) => {
        const now = new Date();
        let d = new Date();
        switch (type) {
            case 'demo': d.setDate(now.getDate() + 7); break;
            case 'monthly': d.setMonth(now.getMonth() + 1); break;
            case 'semiannual': d.setMonth(now.getMonth() + 6); break;
            case 'annual': d.setFullYear(now.getFullYear() + 1); break;
            default: return;
        }
        updateRenewalDate(company, d.toISOString());
    };

    const changePlan = async (company, newPlan) => {
        setActionId(company.id);
        try {
            const updates = { plan: newPlan };
            if (newPlan !== 'free' && (!company.renewal_date || company.plan === 'free')) {
                const d = new Date(); d.setMonth(d.getMonth() + 1);
                updates.renewal_date = d.toISOString();
            }
            const { error } = await supabase.from('companies').update(updates).eq('id', company.id);
            if (error) throw error;
            showToast(`Plan de ${company.name} actualizado`, 'success');
            fetchData();
        } finally { setActionId(null); }
    };

    const handleObserve = async (company) => {
        await startObserving(company);
        navigate('/dashboard');
        showToast(`Observando: ${company.name}`, 'info');
    };

    const handleObserveUser = async (user) => {
        if (user.company) {
            // Owner: observe their store dashboard
            await startObservingUser(user, user.company);
            navigate('/dashboard');
            showToast(`Observando tienda de: ${user.full_name || user.email}`, 'info');
        } else {
            // Regular client: observe their customer panel
            await startObservingUser(user, null);
            navigate('/dashboard/cliente');
            showToast(`Observando panel de: ${user.full_name || user.email}`, 'info');
        }
    };

    const isExpired = (date) => {
        if (!date) return false;
        const renewal = new Date(date);
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()) >= new Date(renewal.getFullYear(), renewal.getMonth(), renewal.getDate());
    };

    const inGracePeriod = (date) => {
        if (!date) return false;
        const now = new Date();
        const renewal = new Date(date);
        const graceEnd = new Date(renewal);
        graceEnd.setDate(graceEnd.getDate() + 3);
        const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const renewalDay = new Date(renewal.getFullYear(), renewal.getMonth(), renewal.getDate());
        return nowDay >= renewalDay && nowDay <= graceEnd;
    };

    // Stats (only for current page data, stores tab)
    const expiredCount = activeTab === 'stores' ? items.filter(u => u.plan !== 'free' && isExpired(u.renewal_date) && !inGracePeriod(u.renewal_date)).length : 0;
    const graceCount = activeTab === 'stores' ? items.filter(u => u.plan !== 'free' && inGracePeriod(u.renewal_date)).length : 0;

    // ─── Render ─────────────────────────────────────────────────────────
    return (
        <div className="w-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Usuarios & Tiendas</h1>
                <form onSubmit={handleSearch} className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Buscar por nombre o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-20"
                    />
                    <Button type="submit" size="sm" className="absolute right-1 top-1 h-8 px-3 rounded-lg font-bold bg-slate-900 text-white text-xs">Buscar</Button>
                </form>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-slate-100 rounded-xl w-full max-w-xs mb-6">
                <button
                    onClick={() => { setActiveTab('stores'); setPage(0); setSearch(''); setAppliedSearch(''); }}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg font-bold text-xs transition-all",
                        activeTab === 'stores' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <Store size={14} /> Tiendas
                </button>
                <button
                    onClick={() => { setActiveTab('customers'); setPage(0); setSearch(''); setAppliedSearch(''); }}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg font-bold text-xs transition-all",
                        activeTab === 'customers' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <Users size={14} /> Clientes
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-slate-400 font-bold italic">No se encontraron resultados.</p>
                </div>
            ) : activeTab === 'stores' ? (
                <>
                    {/* ═══ STORES TAB ═══ */}
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card className="border-none shadow-sm bg-white overflow-hidden group">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Tiendas</h3>
                                        <p className="text-2xl font-black text-slate-900">{totalCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={cn("border-none shadow-sm overflow-hidden group transition-all", expiredCount > 0 ? "bg-red-50 ring-2 ring-red-200" : "bg-white")}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-colors", expiredCount > 0 ? "bg-red-100 text-red-600" : "bg-slate-50 text-slate-400")}>
                                        <AlertTriangle size={24} className={cn(expiredCount > 0 && "animate-pulse")} />
                                    </div>
                                    <div>
                                        <h3 className={cn("text-[10px] font-black uppercase tracking-widest", expiredCount > 0 ? "text-red-600" : "text-slate-400")}>Vencidos / Deuda</h3>
                                        <p className={cn("text-2xl font-black", expiredCount > 0 ? "text-red-700" : "text-slate-900")}>{expiredCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={cn("border-none shadow-sm overflow-hidden group transition-all", graceCount > 0 ? "bg-amber-50 ring-2 ring-amber-200" : "bg-white")}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-colors", graceCount > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-50 text-slate-400")}>
                                        <Clock size={24} className={cn(graceCount > 0 && "animate-pulse")} />
                                    </div>
                                    <div>
                                        <h3 className={cn("text-[10px] font-black uppercase tracking-widest", graceCount > 0 ? "text-amber-600" : "text-slate-400")}>En Gracia (3 días)</h3>
                                        <p className={cn("text-2xl font-black", graceCount > 0 ? "text-amber-700" : "text-slate-900")}>{graceCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Tienda</th>
                                            <th className="px-4 py-4 font-semibold text-slate-700">Categoría</th>
                                            <th className="px-4 py-4 font-semibold text-slate-700">Plan</th>
                                            <th className="px-4 py-4 font-semibold text-slate-700">Suscripción</th>
                                            <th className="px-4 py-4 font-semibold text-slate-700">Estado</th>
                                            <th className="px-4 py-4 font-semibold text-slate-700 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100">
                                                            {user.logo ? (
                                                                <img src={user.logo} alt={user.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <Store size={20} className="text-slate-300" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1">
                                                                <p className="font-bold text-slate-900">{user.name}</p>
                                                                {user.plan !== 'free' && (
                                                                    <BadgeCheck className={`h-4 w-4 ${user.plan === 'pro' ? 'text-amber-500' : 'text-blue-500'}`} />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500">{user.profiles?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge variant="outline" className="font-bold text-[10px] rounded-full px-2.5 py-0.5 border-slate-200 text-slate-600">
                                                        {BUSINESS_TYPE_LABELS[user.business_type] || 'Minorista'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "gap-1.5 font-bold px-2.5 py-1 rounded-full",
                                                            user.plan === 'pro' ? "border-amber-200 text-amber-700 bg-amber-50 shadow-sm" :
                                                                user.plan === 'plus' ? "border-blue-200 text-blue-700 bg-blue-50 shadow-sm" :
                                                                    user.plan === 'custom' ? "border-slate-300 text-slate-700 bg-slate-100 shadow-sm" :
                                                                        "border-slate-200 text-slate-500 bg-white"
                                                        )}
                                                    >
                                                        {user.plan === 'plus' && <Zap size={12} className="text-blue-500 fill-blue-500" />}
                                                        {user.plan === 'pro' && <Sparkles size={12} className="text-amber-500 fill-amber-500" />}
                                                        {user.plan === 'custom' && <Shield size={12} className="text-slate-700 fill-slate-700" />}
                                                        {(user.plan || 'free').toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {user.plan === 'free' ? (
                                                        <span className="text-slate-400 text-xs font-medium italic">De por vida</span>
                                                    ) : (
                                                        <div className="flex flex-col gap-1 min-w-[140px]">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "text-xs font-bold",
                                                                    inGracePeriod(user.renewal_date) ? "text-amber-500" :
                                                                        isExpired(user.renewal_date) ? "text-red-500" : "text-slate-700"
                                                                )}>
                                                                    {user.renewal_date ? new Date(user.renewal_date).toLocaleDateString() : 'Sin fecha'}
                                                                </span>
                                                                {inGracePeriod(user.renewal_date) && <Clock size={14} className="text-amber-500 animate-pulse" />}
                                                                {isExpired(user.renewal_date) && !inGracePeriod(user.renewal_date) && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                                                            </div>

                                                            {editingRenewal?.id === user.id ? (
                                                                <div className="flex flex-col gap-2 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                                    <Input
                                                                        type="date"
                                                                        className="h-7 text-[10px]"
                                                                        onChange={(e) => setEditingRenewal({ ...editingRenewal, date: e.target.value })}
                                                                    />
                                                                    <div className="grid grid-cols-2 gap-1">
                                                                        <Button size="xs" variant="primary" className="h-6 text-[9px]" onClick={() => updateRenewalDate(user, new Date(editingRenewal.date + 'T12:00:00').toISOString())}>Guardar</Button>
                                                                        <Button size="xs" variant="ghost" className="h-6 text-[9px]" onClick={() => setEditingRenewal(null)}>Cancelar</Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-1">
                                                                    <Tooltip content="Fecha Personalizada">
                                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-primary-600" onClick={() => setEditingRenewal({ id: user.id })}>
                                                                            <Calendar size={12} />
                                                                        </Button>
                                                                    </Tooltip>
                                                                    <Button size="xs" variant="outline" className="h-6 px-1 text-[9px] font-bold border-emerald-100 text-emerald-600 hover:bg-emerald-50" onClick={() => setRenewalPreset(user, 'monthly')} title="+1 Mes">+M</Button>
                                                                    <Button size="xs" variant="outline" className="h-6 px-1 text-[9px] font-bold border-blue-100 text-blue-600 hover:bg-blue-50" onClick={() => setRenewalPreset(user, 'semiannual')} title="+6 Meses">+S</Button>
                                                                    <Button size="xs" variant="outline" className="h-6 px-1 text-[9px] font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50" onClick={() => setRenewalPreset(user, 'annual')} title="+1 Año">+A</Button>
                                                                    <Button size="xs" variant="outline" className="h-6 px-1 text-[9px] font-bold border-amber-100 text-amber-600 hover:bg-amber-50" onClick={() => setRenewalPreset(user, 'demo')} title="+7 Días Demo">+D</Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge
                                                        variant={user.profiles?.status === 'blocked' ? 'error' :
                                                            inGracePeriod(user.renewal_date) ? 'warning' :
                                                                isExpired(user.renewal_date) ? 'error' : 'success'}
                                                        className="uppercase text-[9px] font-black tracking-tight"
                                                    >
                                                        {user.profiles?.status === 'blocked' ? 'Bloqueado' :
                                                            inGracePeriod(user.renewal_date) ? 'En Gracia' :
                                                                isExpired(user.renewal_date) ? 'Vencido' : 'Activo'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <a href={`/catalogo/${user.slug}`} target="_blank" rel="noopener noreferrer">
                                                            <Button size="icon" variant="ghost" title="Ver Tienda" className="h-8 w-8 hover:bg-slate-100">
                                                                <ExternalLink size={16} className="text-slate-400" />
                                                            </Button>
                                                        </a>
                                                        <select
                                                            value={user.plan || 'free'}
                                                            onChange={(e) => changePlan(user, e.target.value)}
                                                            disabled={actionId === user.id}
                                                            className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg px-2 py-1 outline-none cursor-pointer disabled:opacity-50"
                                                        >
                                                            <option value="free">FREE</option>
                                                            <option value="plus">PLUS</option>
                                                            <option value="pro">PRO</option>
                                                            <option value="custom">CUSTOM</option>
                                                        </select>
                                                        <Button size="icon" variant="ghost" title="Modo Observador" className="h-8 w-8 text-primary-500 hover:bg-primary-50" onClick={() => handleObserve(user)}>
                                                            <Eye size={16} />
                                                        </Button>
                                                        <Button
                                                            size="icon" variant="ghost" disabled={actionId === user.user_id}
                                                            onClick={() => toggleBlockUser(user)}
                                                            title={user.profiles?.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                                                            className={cn("h-8 w-8", user.profiles?.status === 'active' ? "text-red-400 hover:bg-red-50" : "text-emerald-400 hover:bg-emerald-50")}
                                                        >
                                                            {actionId === user.user_id ? <Loader2 size={16} className="animate-spin text-slate-400" /> :
                                                                user.profiles?.status === 'active' ? <ShieldOff size={16} /> : <Shield size={16} />}
                                                        </Button>
                                                        <Button
                                                            size="icon" variant="ghost" disabled={actionId === user.id}
                                                            onClick={() => setDeletingItem({ id: user.id, name: user.name, type: 'store' })}
                                                            title="Eliminar Tienda"
                                                            className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {items.map((user) => (
                            <Card key={user.id} className="border-none shadow-sm overflow-hidden p-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100 flex-shrink-0">
                                        {user.logo ? <img src={user.logo} alt={user.name} className="h-full w-full object-cover" /> : <Store size={24} className="text-slate-300" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-slate-900 truncate">{user.name}</p>
                                            <Badge variant={user.profiles?.status === 'active' ? 'success' : 'error'} className="text-[10px] px-1.5 py-0 h-4">
                                                {user.profiles?.status === 'active' ? 'Activo' : 'Bloqueado'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate font-medium">{user.profiles?.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Plan</p>
                                        <p className="font-black text-slate-700 text-xs">{(user.plan || 'free').toUpperCase()}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Tipo</p>
                                        <p className="font-black text-slate-700 text-[10px]">{BUSINESS_TYPE_LABELS[user.business_type] || 'Minorista'}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Registro</p>
                                        <p className="font-black text-slate-700 text-xs">{new Date(user.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Renewal info */}
                                {(user.plan || 'free') !== 'free' && (
                                    <div className="bg-slate-50 rounded-xl p-3 mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Renovación</span>
                                            <span className={cn("text-xs font-bold",
                                                inGracePeriod(user.renewal_date) ? "text-amber-500" :
                                                    isExpired(user.renewal_date) ? "text-red-500" : "text-slate-700"
                                            )}>
                                                {user.renewal_date ? new Date(user.renewal_date).toLocaleDateString() : 'Sin fecha'}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="xs" variant="outline" className="flex-1 h-7 text-[9px] font-bold" onClick={() => setRenewalPreset(user, 'monthly')}>+M</Button>
                                            <Button size="xs" variant="outline" className="flex-1 h-7 text-[9px] font-bold" onClick={() => setRenewalPreset(user, 'semiannual')}>+S</Button>
                                            <Button size="xs" variant="outline" className="flex-1 h-7 text-[9px] font-bold" onClick={() => setRenewalPreset(user, 'annual')}>+A</Button>
                                            <Button size="xs" variant="outline" className="flex-1 h-7 text-[9px] font-bold" onClick={() => setRenewalPreset(user, 'demo')}>+D</Button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                                    <div className="flex-1">
                                        <select value={user.plan || 'free'} onChange={(e) => changePlan(user, e.target.value)} disabled={actionId === user.id}
                                            className="w-full bg-slate-100 border-none text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer disabled:opacity-50">
                                            <option value="free">FREE</option>
                                            <option value="plus">PLUS</option>
                                            <option value="pro">PRO</option>
                                            <option value="custom">CUSTOM</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <a href={`/catalogo/${user.slug}`} target="_blank" rel="noopener noreferrer">
                                            <Button size="icon" variant="ghost" className="h-10 w-10 bg-slate-50 rounded-xl"><ExternalLink size={18} className="text-slate-400" /></Button>
                                        </a>
                                        <Button size="icon" variant="ghost" className="h-10 w-10 bg-slate-50 rounded-xl" onClick={() => handleObserve(user)}>
                                            <Eye size={18} className="text-primary-500" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-10 w-10 bg-slate-50 rounded-xl" onClick={() => setEditingItem(user)}>
                                            <Edit2 size={18} className="text-slate-400" />
                                        </Button>
                                        <Button size="icon" variant="ghost"
                                            className={cn("h-10 w-10 rounded-xl", user.profiles?.status === 'active' ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500")}
                                            disabled={actionId === user.user_id} onClick={() => toggleBlockUser(user)}>
                                            {actionId === user.user_id ? <Loader2 size={16} className="animate-spin" /> :
                                                user.profiles?.status === 'active' ? <ShieldOff size={18} /> : <Shield size={18} />}
                                        </Button>
                                        <Button
                                            size="icon" variant="ghost" className="h-10 w-10 bg-red-50 text-red-400 hover:text-red-600 rounded-xl"
                                            disabled={actionId === user.id} onClick={() => setDeletingItem({ id: user.id, name: user.name, type: 'store' })}>
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {/* ═══ CUSTOMERS TAB ═══ */}
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-slate-700">Usuario</th>
                                            <th className="px-4 py-4 font-semibold text-slate-700">Email</th>
                                            <th className="px-4 py-4 font-semibold text-slate-700">Rol</th>
                                            <th className="px-4 py-4 font-semibold text-slate-700">Estado</th>
                                            <th className="px-4 py-4 font-semibold text-slate-700">Registro</th>
                                            <th className="px-4 py-4 font-semibold text-slate-700 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100">
                                                            {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : <Users size={20} className="text-slate-300" />}
                                                        </div>
                                                        <p className="font-bold text-slate-900">{user.full_name || 'Sin nombre'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-xs text-slate-500">{user.email}</td>
                                                <td className="px-4 py-4">
                                                    <Badge variant="outline" className={cn("font-bold text-[10px] rounded-full px-2.5 py-0.5",
                                                        user.role === 'admin' ? "border-violet-200 text-violet-700 bg-violet-50" :
                                                            user.role === 'owner' ? "border-blue-200 text-blue-700 bg-blue-50" :
                                                                "border-slate-200 text-slate-500")}>
                                                        {user.role === 'admin' ? 'Admin' : user.role === 'owner' ? 'Dueño' : 'Cliente'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge variant={user.status === 'blocked' ? 'error' : 'success'} className="uppercase text-[9px] font-black tracking-tight">
                                                        {user.status === 'blocked' ? 'Bloqueado' : 'Activo'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 text-xs text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {user.company && (
                                                            <a href={`/catalogo/${user.company.slug}`} target="_blank" rel="noopener noreferrer">
                                                                <Button size="icon" variant="ghost" title="Ver Tienda" className="h-8 w-8 hover:bg-slate-100">
                                                                    <ExternalLink size={16} className="text-slate-400" />
                                                                </Button>
                                                            </a>
                                                        )}
                                                        <Button size="icon" variant="ghost" title={user.company ? 'Observar Tienda' : 'Observar Panel Cliente'} className="h-8 w-8 text-primary-500 hover:bg-primary-50" onClick={() => handleObserveUser(user)}>
                                                            <Eye size={16} />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" title="Editar" className="h-8 w-8 text-slate-400 hover:bg-slate-100" onClick={() => setEditingItem(user)}>
                                                            <Edit2 size={16} />
                                                        </Button>
                                                        <Button
                                                            size="icon" variant="ghost" disabled={actionId === user.id}
                                                            onClick={() => toggleBlockUser(user)}
                                                            title={user.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                                                            className={cn("h-8 w-8", user.status === 'active' ? "text-red-400 hover:bg-red-50" : "text-emerald-400 hover:bg-emerald-50")}
                                                        >
                                                            {actionId === user.id ? <Loader2 size={16} className="animate-spin text-slate-400" /> :
                                                                user.status === 'active' ? <ShieldOff size={16} /> : <Shield size={16} />}
                                                        </Button>
                                                        <Button
                                                            size="icon" variant="ghost" disabled={actionId === user.id}
                                                            onClick={() => setDeletingItem({ id: user.id, name: user.full_name || user.email, type: 'user', company: user.company })}
                                                            title="Eliminar Usuario"
                                                            className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {items.map((user) => (
                            <Card key={user.id} className="border-none shadow-sm overflow-hidden p-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100 flex-shrink-0">
                                        {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : <Users size={24} className="text-slate-300" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-slate-900 truncate">{user.full_name || 'Sin nombre'}</p>
                                            <Badge variant={user.status === 'active' ? 'success' : 'error'} className="text-[10px] px-1.5 py-0 h-4">
                                                {user.status === 'active' ? 'Activo' : 'Bloqueado'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate font-medium">{user.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Rol</p>
                                        <p className="font-black text-slate-700 text-xs">{user.role === 'admin' ? 'Admin' : user.role === 'owner' ? 'Dueño' : 'Cliente'}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Registro</p>
                                        <p className="font-black text-slate-700 text-xs">{new Date(user.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                                    <div className="flex items-center gap-1 ml-auto">
                                        {user.company && (
                                            <a href={`/catalogo/${user.company.slug}`} target="_blank" rel="noopener noreferrer">
                                                <Button size="icon" variant="ghost" className="h-10 w-10 bg-slate-50 rounded-xl"><ExternalLink size={18} className="text-slate-400" /></Button>
                                            </a>
                                        )}
                                        <Button size="icon" variant="ghost" className="h-10 w-10 bg-slate-50 rounded-xl" onClick={() => handleObserveUser(user)}>
                                            <Eye size={18} className="text-primary-500" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-10 w-10 bg-slate-50 rounded-xl" onClick={() => setEditingItem(user)}>
                                            <Edit2 size={18} className="text-slate-400" />
                                        </Button>
                                        <Button size="icon" variant="ghost"
                                            className={cn("h-10 w-10 rounded-xl", user.status === 'active' ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500")}
                                            disabled={actionId === user.id} onClick={() => toggleBlockUser(user)}>
                                            {actionId === user.id ? <Loader2 size={16} className="animate-spin" /> :
                                                user.status === 'active' ? <ShieldOff size={18} /> : <Shield size={18} />}
                                        </Button>
                                        <Button
                                            size="icon" variant="ghost" className="h-10 w-10 bg-red-50 text-red-400 hover:text-red-600 rounded-xl"
                                            disabled={actionId === user.id} onClick={() => setDeletingItem({ id: user.id, name: user.full_name || user.email, type: 'user', company: user.company })}>
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                <p className="text-xs text-slate-400 font-medium">
                    Página {page + 1} de {Math.ceil(totalCount / PAGE_SIZE) || 1} • {totalCount} registros
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage(page - 1)} className="h-8 rounded-lg font-bold">
                        <ChevronLeft size={16} className="mr-1" /> Anterior
                    </Button>
                    <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= totalCount || loading} onClick={() => setPage(page + 1)} className="h-8 rounded-lg font-bold">
                        Siguiente <ChevronRight size={16} className="ml-1" />
                    </Button>
                </div>
            </div>

            {/* Edit Modal */}
            {editingItem && (
                <UserEditModal
                    item={editingItem}
                    type={activeTab === 'stores' ? 'store' : 'customer'}
                    onClose={() => setEditingItem(null)}
                    onSave={() => { fetchData(); showToast("Cambios guardados exitosamente", "success"); }}
                />
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingItem && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 text-center">
                                <div className="h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <AlertTriangle size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">¿Eliminar {deletingItem.type === 'store' ? 'Tienda' : 'Usuario'}?</h2>
                                <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                                    Estás a punto de eliminar permanentemente a <span className="text-red-500">"{deletingItem.name}"</span>.
                                    Esta acción no se puede deshacer y borrará todos los datos asociados (productos, imágenes, etc).
                                </p>

                                <div className="flex gap-3">
                                    <Button variant="ghost" onClick={() => setDeletingItem(null)} className="flex-1 h-14 rounded-2xl font-bold">
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleDelete}
                                        disabled={actionId !== null}
                                        className="flex-1 h-14 rounded-2xl font-black bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-200"
                                    >
                                        {actionId !== null ? <Loader2 className="animate-spin" /> : 'Sí, Eliminar'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
