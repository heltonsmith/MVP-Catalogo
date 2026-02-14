import { Zap, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';

const PLANS = [
    {
        id: 'mensual',
        name: 'Plan Mensual',
        price: '$9.990',
        period: '/mes',
        description: 'Ideal para probar todas las funciones PRO.',
        features: ['Productos Ilimitados', 'Fotos Infinitas', 'Chat Integrado', 'Sin branding ktaloog']
    },
    {
        id: 'semestral',
        name: 'Plan Semestral',
        price: '$8.500',
        period: '/mes',
        savings: 'Ahorra $8.940',
        total: 'Pago único $51.000',
        description: 'La mejor opción para negocios establecidos.',
        popular: true,
        features: ['Productos Ilimitados', 'Soporte Prioritario', 'Analíticas Básicas', 'Sin branding ktaloog']
    },
    {
        id: 'anual',
        name: 'Plan Anual',
        price: '$6.500',
        period: '/mes',
        savings: 'Mejor relación calidad-precio',
        total: 'Pago único $78.000',
        description: 'Para quienes apuestan por el largo plazo.',
        features: ['Todo lo anterior', 'Dominio personalizado*', 'Analíticas IA', 'Soporte 24/7']
    }
];

export function PlanUpgradeModal({ isOpen, onClose, companyId }) {
    const { showToast } = useToast();
    const [selectedPlan, setSelectedPlan] = useState('semestral');
    const [loading, setLoading] = useState(false);

    const handleRequestUpgrade = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('upgrade_requests')
                .insert([{
                    company_id: companyId,
                    requested_plan: selectedPlan,
                    status: 'pending'
                }]);

            if (error) throw error;

            showToast("Solicitud enviada. Nos contactaremos contigo para activar tu plan.", "success");
            onClose();
        } catch (error) {
            console.error('Error requesting upgrade:', error);
            showToast("No se pudo enviar la solicitud", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sube a ktaloog PRO" maxWidth="3xl">
            <div className="p-6">
                <p className="text-slate-500 mb-8 text-center max-w-lg mx-auto">
                    Potencia tu negocio con herramientas avanzadas y elimina todas las limitaciones. Elige el plan que mejor se adapte a ti.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`relative p-5 rounded-3xl border-2 transition-all cursor-pointer ${selectedPlan === plan.id
                                    ? 'border-primary-500 bg-primary-50/30'
                                    : 'border-slate-100 hover:border-slate-200 bg-white'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                    Recomendado
                                </div>
                            )}

                            <div className="mb-4">
                                <h4 className="font-bold text-slate-900">{plan.name}</h4>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black text-slate-900">{plan.price}</span>
                                    <span className="text-xs text-slate-400 font-medium">{plan.period}</span>
                                </div>
                                {plan.savings && (
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">{plan.savings}</p>
                                )}
                                {plan.total && (
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{plan.total}</p>
                                )}
                            </div>

                            <ul className="space-y-2 mb-4">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <div className={`mt-auto h-2 w-full rounded-full ${selectedPlan === plan.id ? 'bg-primary-500' : 'bg-slate-100'}`} />
                        </div>
                    ))}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mb-8 flex items-start gap-4">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
                        <Zap className="text-primary-500" size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">Activación Manual</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Al solicitar el plan, nuestro equipo se pondrá en contacto contigo vía WhatsApp o Email para coordinar el pago y activar tu cuenta en menos de 24 horas.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="ghost" className="flex-1 font-bold" onClick={onClose}>
                        Quizás más tarde
                    </Button>
                    <Button className="flex-1 h-12 font-bold shadow-lg shadow-primary-100" onClick={handleRequestUpgrade} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={18} className="mr-2 fill-current" />}
                        Solicitar Plan {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
