import { useState, useEffect } from 'react';
import {
    ShoppingBag,
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
    ExternalLink,
    Store,
    Calendar,
    Hash
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../utils';

export default function CustomerOrders() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            loadOrders();
        }
    }, [user]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('*, company:companies(*)')
                .eq('customer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesTab = activeTab === 'all' || o.status === activeTab;
        const matchesSearch = o.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-white rounded-3xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <ShoppingBag size={28} className="text-blue-500" /> Mis Pedidos
                </h2>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                        placeholder="Buscar por tienda o ID..."
                        className="pl-10 h-10 w-full sm:w-64 bg-white border-none shadow-sm rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 self-start w-fit">
                {[
                    { id: 'all', label: 'Todos' },
                    { id: 'pending', label: 'Pendientes' },
                    { id: 'completed', label: 'Listos' },
                    { id: 'cancelled', label: 'Cancelados' }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === t.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {filteredOrders.length > 0 ? (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <Card key={order.id} className="border-none bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                            {order.company?.logo ? (
                                                <img src={order.company.logo} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <Store className="text-slate-300" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-900 truncate uppercase tracking-tight">{order.company?.name || 'Tienda'}</h4>
                                                <Link to={`/catalogo/${order.company?.slug}`} className="text-primary-600 hover:text-primary-700">
                                                    <ExternalLink size={14} />
                                                </Link>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                <span className="flex items-center gap-1"><Hash size={10} /> {order.id.split('-')[0]}</span>
                                                <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(order.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Monto Total</p>
                                            <p className="text-lg font-black text-slate-900">${order.total?.toLocaleString() || '0'}</p>
                                        </div>

                                        <div className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                                            order.status === 'pending' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                order.status === 'completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                    "bg-slate-50 text-slate-500 border border-slate-100"
                                        )}>
                                            {order.status === 'pending' ? <Clock size={12} /> :
                                                order.status === 'completed' ? <CheckCircle2 size={12} /> :
                                                    <XCircle size={12} />}
                                            {order.status === 'pending' ? 'Pedido Pendiente' :
                                                order.status === 'completed' ? 'Pedido Listo' :
                                                    'Cancelado'}
                                        </div>

                                        <Link to={`/dashboard/cliente/pedidos/${order.id}`}>
                                            <button className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center">
                                                <ChevronRight size={20} />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] p-16 text-center space-y-6 shadow-sm">
                    <div className="h-24 w-24 bg-blue-50 text-blue-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag size={48} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-xl mb-2">¿Aún no has hecho pedidos?</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium leading-relaxed">Explora los catálogos de tus tiendas favoritas y realiza pedidos de forma rápida y sencilla.</p>
                    </div>
                    <Link to="/explorar">
                        <Button className="rounded-2xl px-10 h-12 text-sm font-black shadow-xl shadow-primary-200 uppercase tracking-widest">Explorar Tiendas</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
