import { useState, useEffect } from 'react';
import { ShoppingBag, Calendar, Store, ChevronRight, MessageSquare, ExternalLink, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils';
import { Link } from 'react-router-dom';

export default function CustomerQuotes() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [quotes, setQuotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            loadQuotes();
        }
    }, [user]);

    const loadQuotes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('whatsapp_quotes')
                .select('*, company:companies(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setQuotes(data || []);
        } catch (error) {
            console.error('Error loading quotes:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredQuotes = quotes.filter(q =>
        q.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-white rounded-[2rem]" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <MessageSquare size={28} className="text-emerald-500" /> Mis Cotizaciones WhatsApp
                </h2>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                        placeholder="Buscar por tienda o producto..."
                        className="pl-10 h-10 w-full sm:w-64 bg-white border-none shadow-sm rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredQuotes.length > 0 ? (
                <div className="space-y-4">
                    {filteredQuotes.map((quote) => (
                        <Card key={quote.id} className="border-none bg-white rounded-[2.5rem] shadow-sm overflow-hidden group hover:shadow-md transition-all">
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex items-center gap-4 min-w-[200px]">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                                            {quote.company?.logo ? (
                                                <img src={quote.company.logo} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <Store className="text-slate-300" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px]">
                                                {quote.company?.name}
                                            </h4>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                <Calendar size={10} /> {new Date(quote.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-1 gap-2">
                                            {quote.items && Array.isArray(quote.items) ? (
                                                quote.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-slate-50/50 rounded-xl p-3 border border-slate-100 group-hover:bg-white transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            {item.image && (
                                                                <img src={item.image} alt="" className="h-8 w-8 rounded-lg object-cover border border-slate-100" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[150px]">{item.name}</p>
                                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">CANT: {item.quantity}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-primary-600">{formatCurrency(item.price * item.quantity)}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                                    <p className="text-xs text-slate-600 whitespace-pre-wrap font-medium leading-relaxed">
                                                        {quote.content}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-4 min-w-[120px]">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL</p>
                                            <p className="text-xl font-black text-emerald-600">{formatCurrency(quote.total)}</p>
                                        </div>
                                        <Link to={`/catalogo/${quote.company?.slug}`}>
                                            <Button variant="outline" size="sm" className="rounded-xl border-2 font-black text-[10px] gap-2 uppercase tracking-widest h-10">
                                                Volver a Tienda <ExternalLink size={12} />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] p-16 text-center space-y-6 shadow-sm">
                    <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <ShoppingBag size={40} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-xl mb-2">No tienes cotizaciones guardadas</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">Todas las cotizaciones que envíes por WhatsApp quedarán registradas aquí para tu control.</p>
                    </div>
                    <Link to="/explorar">
                        <Button className="rounded-2xl px-10 h-12 text-sm font-black shadow-xl shadow-primary-200 uppercase tracking-widest">Empezar a comprar</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
