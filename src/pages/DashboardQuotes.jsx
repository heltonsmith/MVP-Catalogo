import { FileText, ExternalLink, Calendar, Clock, User, ArrowUpRight, BadgeCheck } from 'lucide-react';
import { QUOTES } from '../data/mock';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, cn } from '../utils';
import { useToast } from '../components/ui/Toast';

export default function DashboardQuotes() {
    const { showToast } = useToast();

    const getStatusStyle = (status) => {
        switch (status) {
            case 'accepted': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'expired': return 'bg-slate-50 text-slate-400 border-slate-100';
            default: return 'bg-slate-50 text-slate-500';
        }
    };

    const handleDemoAction = () => {
        showToast("Esta función de gestión no está disponible en la versión de demostración.", "demo");
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Cotizaciones WhatsApp</h1>
                    <p className="text-slate-500">Historial de presupuestos enviados a tus clientes.</p>
                </div>
                <Button onClick={handleDemoAction} className="h-10 w-10 p-0 md:h-10 md:w-auto md:px-4 shrink-0">
                    <BadgeCheck className="h-5 w-5 md:mr-2" />
                    <span className="hidden md:inline">Configurar Auto-Quote</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {QUOTES.map((quote) => (
                    <Card key={quote.id} className="border-none shadow-sm overflow-hidden hover:shadow-md transition-all">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                                {/* Quote Main Info */}
                                <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center">
                                                <FileText size={18} className="text-primary-600" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">#{quote.id}</span>
                                        </div>
                                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2 py-0.5", getStatusStyle(quote.status))}>
                                            {quote.status === 'accepted' ? 'Aceptada' : quote.status === 'pending' ? 'Pendiente' : 'Expirada'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                                <User size={18} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{quote.customer}</p>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5">
                                                    <span className="flex items-center gap-1"><Calendar size={10} /> {quote.date}</span>
                                                    <span className="flex items-center gap-1"><Clock size={10} /> {quote.time}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-xl p-4 space-y-2">
                                            {quote.items.map((item, i) => (
                                                <div key={i} className="flex justify-between text-xs">
                                                    <span className="text-slate-600"><span className="font-bold">{item.quantity}x</span> {item.name}</span>
                                                    <span className="font-bold text-slate-800">{formatCurrency(item.price * item.quantity)}</span>
                                                </div>
                                            ))}
                                            <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase uppercase tracking-widest">Total Cotizado</span>
                                                <span className="text-sm font-bold text-primary-600">{formatCurrency(quote.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quote Sidebar Actions */}
                                <div className="w-full md:w-64 p-6 bg-slate-50/30 flex flex-col justify-between gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100">
                                            <BadgeCheck size={14} />
                                            Enviado vía {quote.platform}
                                        </div>
                                        <p className="text-[10px] text-slate-500 italic">Cliente recibió el link de pago y detalle de productos.</p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                                        <Button variant="outline" size="sm" className="w-full text-xs font-bold border-slate-200" onClick={handleDemoAction}>
                                            Ver PDF
                                        </Button>
                                        <Button variant="secondary" size="sm" className="w-full text-xs font-bold" onClick={handleDemoAction}>
                                            <ArrowUpRight size={14} className="mr-1" />
                                            Re-enviar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State / Info */}
            <div className="mt-12 p-8 text-center rounded-3xl border-2 border-dashed border-slate-200">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <ExternalLink size={32} className="text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold">Integración WhatsApp</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">
                    Todas las cotizaciones generadas en la demo se sincronizan automáticamente con tu historial para seguimiento comercial.
                </p>
            </div>
        </div>
    );
}
