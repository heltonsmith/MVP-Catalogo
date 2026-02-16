import { Zap, Check, Loader2, AlertCircle, User, Mail, Building2, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../context/AuthContext';

export function PlanUpgradeModal({ isOpen, onClose, companyId }) {
    const { getSetting, loading: settingsLoading } = useSettings();
    const { showToast } = useToast();
    const { profile, company } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState('plus');
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('selection'); // selection, details
    const [pendingRequest, setPendingRequest] = useState(null);
    const [checkingPending, setCheckingPending] = useState(true);

    const [details, setDetails] = useState({
        rut: '',
        fullName: '',
        email: ''
    });

    useEffect(() => {
        if (profile) {
            setDetails({
                rut: '',
                fullName: profile.full_name || '',
                email: profile.email || ''
            });
        }
    }, [profile]);

    useEffect(() => {
        const checkPending = async () => {
            if (!companyId) return;
            try {
                const { data, error } = await supabase
                    .from('upgrade_requests')
                    .select('*')
                    .eq('company_id', companyId)
                    .eq('status', 'pending')
                    .maybeSingle();

                if (error) throw error;
                setPendingRequest(data);
            } catch (error) {
                console.error('Error checking pending upgrade:', error);
            } finally {
                setCheckingPending(false);
            }
        };

        if (isOpen) {
            checkPending();
            setStep('selection');
        }
    }, [isOpen, companyId]);

    const plusProductLimit = getSetting('plus_plan_product_limit', '100');
    const plusImageLimit = getSetting('plus_plan_image_limit', '5');
    const proProductLimit = getSetting('pro_plan_product_limit', '500');
    const proImageLimit = getSetting('pro_plan_image_limit', '5');
    const customProductLimit = getSetting('custom_plan_product_limit', '1000');
    const customImageLimit = getSetting('custom_plan_image_limit', '10');

    const BILLING_PERIODS = [
        { id: 'monthly', label: 'Mensual', discount: 0 },
        { id: 'semester', label: 'Semestral', discount: 0.10 },
        { id: 'annual', label: 'Anual', discount: 0.20 }
    ];

    const PLANS = [
        {
            id: 'plus',
            name: 'Plan Plus',
            monthlyPrice: 9990,
            description: `Hasta ${plusProductLimit} productos y ${plusImageLimit} fotos por cada uno.`,
            features: [
                `Hasta ${plusProductLimit} Productos`,
                `${plusImageLimit} Fotos por Producto`,
                'Chat Integrado',
                'WhatsApp Directo',
                'Soporte Prioritario',
                'Funciones Avanzadas'
            ],
            color: 'border-primary-500 bg-primary-50/30',
            badge: 'Recomendado'
        },
        {
            id: 'pro',
            name: 'Plan Pro',
            monthlyPrice: 19990,
            description: `Hasta ${proProductLimit} productos y ${proImageLimit} fotos por cada uno.`,
            features: [
                `Hasta ${proProductLimit} Productos`,
                `${proImageLimit} Fotos por Producto`,
                'Chat Integrado',
                'WhatsApp Directo',
                'Soporte Prioritario',
                'Funciones Avanzadas'
            ],
            color: 'border-amber-500 bg-amber-50/30',
            iconColor: 'text-amber-500'
        },
        {
            id: 'custom',
            name: 'Personalizado',
            monthlyPrice: null,
            description: 'Para grandes inventarios y soluciones a medida.',
            features: [`Más de ${customProductLimit} Productos`, `Hasta ${customImageLimit} Fotos por Producto`, 'Soporte 24/7 Dedicado', 'Multisucursal'],
            color: 'border-slate-500 bg-slate-50/30',
            isExternal: true,
            link: `https://wa.me/56912345678?text=${encodeURIComponent('Hola, me interesa el Plan Personalizado para mi empresa.')}`
        }
    ];

    const calculatePrice = (plan) => {
        if (!plan.monthlyPrice) return { display: 'Consultar', period: '', monthlyEquivalent: null, totalCost: null };

        const period = BILLING_PERIODS.find(p => p.id === billingPeriod);
        const discount = period.discount;
        const months = billingPeriod === 'monthly' ? 1 : billingPeriod === 'semester' ? 6 : 12;

        const monthlyWithDiscount = Math.round(plan.monthlyPrice * (1 - discount));
        const totalCost = monthlyWithDiscount * months;

        return {
            display: `$${monthlyWithDiscount.toLocaleString('es-CL')}`,
            period: billingPeriod === 'monthly' ? '/mes' : `/${months} meses`,
            monthlyEquivalent: monthlyWithDiscount,
            totalCost: totalCost,
            savings: billingPeriod !== 'monthly' ? Math.round((plan.monthlyPrice - monthlyWithDiscount) * months) : 0
        };
    };

    const handleRequestUpgrade = async () => {
        const plan = PLANS.find(p => p.id === selectedPlan);
        if (plan.isExternal) {
            window.open(plan.link, '_blank');
            onClose();
            return;
        }

        if (step === 'selection') {
            setStep('details');
            return;
        }

        // Validate details
        if (!details.rut || !details.fullName || !details.email) {
            showToast("Por favor completa todos los campos", "error");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('upgrade_requests')
                .insert([{
                    company_id: companyId,
                    requested_plan: selectedPlan,
                    billing_period: billingPeriod,
                    rut: details.rut,
                    full_name: details.fullName,
                    email: details.email,
                    store_name: company?.name || 'Tienda',
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
        <Modal isOpen={isOpen} onClose={onClose} title="Mejora tu Plan de Catálogo" maxWidth="3xl">
            <div className="p-6">
                {checkingPending ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="animate-spin text-primary-500" />
                    </div>
                ) : pendingRequest ? (
                    <div className="py-12 px-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Solicitud en Proceso</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                            Ya tienes una solicitud pendiente para el plan <span className="font-bold text-amber-600 border-b border-amber-200">{pendingRequest.requested_plan.toUpperCase()}</span>.
                        </p>
                        <p className="text-xs text-slate-400 mt-4 italic">
                            Nuestro equipo está revisando tus datos. Te avisaremos pronto.
                        </p>
                        <Button variant="outline" className="mt-8 px-8 font-bold" onClick={onClose}>
                            Entendido
                        </Button>
                    </div>
                ) : step === 'selection' ? (
                    <>
                        <p className="text-slate-500 mb-6 text-center max-w-lg mx-auto">
                            Potencia tu negocio con más capacidad y herramientas avanzadas. Elige el plan que mejor se adapte a tu nivel de inventario.
                        </p>

                        {/* Billing Period Selector */}
                        <div className="mb-8">
                            <label className="text-xs font-bold text-slate-700 mb-3 block text-center uppercase tracking-widest opacity-60">Período de Facturación</label>
                            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto p-1 bg-slate-100/80 rounded-xl">
                                {BILLING_PERIODS.map((period) => (
                                    <button
                                        key={period.id}
                                        onClick={() => setBillingPeriod(period.id)}
                                        className={`relative px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${billingPeriod === period.id
                                            ? 'bg-white text-primary-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                    >
                                        {period.label}
                                        {period.discount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                                                -{Math.round(period.discount * 100)}%
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {settingsLoading ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="animate-spin text-primary-500" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {PLANS.map((plan) => {
                                    const pricing = calculatePrice(plan);
                                    return (
                                        <div
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan.id)}
                                            className={`relative p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col group ${selectedPlan === plan.id
                                                ? plan.color + ' ring-2 ring-primary-500/10'
                                                : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-md'
                                                }`}
                                        >
                                            {plan.badge && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg z-10">
                                                    {plan.badge}
                                                </div>
                                            )}

                                            <div className="mb-4">
                                                <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors uppercase text-sm">{plan.name}</h4>
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    <span className="text-2xl font-black text-slate-900">{pricing.display}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{pricing.period}</span>
                                                </div>
                                                {pricing.totalCost && billingPeriod !== 'monthly' && (
                                                    <div className="mt-2 py-1 px-2 bg-slate-50 rounded-lg">
                                                        <p className="text-[10px] text-slate-600 font-bold">
                                                            <span className="text-slate-900">${pricing.totalCost.toLocaleString('es-CL')}</span> total
                                                        </p>
                                                        {pricing.savings > 0 && (
                                                            <p className="text-[10px] text-emerald-600 font-black">
                                                                ¡Ahorras ${pricing.savings.toLocaleString('es-CL')}!
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{plan.description}</p>
                                            </div>

                                            <ul className="space-y-2 mb-6 flex-1">
                                                {plan.features.map((feature, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 font-bold leading-tight">
                                                        <Check className={`h-3 w-3 shrink-0 mt-0.5 ${plan.iconColor || 'text-emerald-500'}`} />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className={`mt-auto h-1.5 w-full rounded-full transition-all duration-500 ${selectedPlan === plan.id ? (plan.id === 'pro' ? 'bg-amber-500' : plan.id === 'plus' ? 'bg-primary-500' : 'bg-slate-400') : 'bg-slate-100'}`} />
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        <div className="bg-slate-50 rounded-2xl p-4 mb-8 flex items-start gap-4 border border-slate-100">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
                                <Zap className="text-primary-500 animate-pulse" size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">Proceso de Activación</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                                    Al solicitar el plan, verificaremos tu solicitud y te contactaremos para la activación. Los límites se actualizarán instantáneamente tras la aprobación.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button variant="ghost" className="flex-1 font-bold h-12" onClick={onClose}>
                                Volver
                            </Button>
                            <Button className={`flex-1 h-12 font-black shadow-lg ${selectedPlan === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-600 hover:bg-primary-700'}`} onClick={handleRequestUpgrade} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={18} className="mr-2 fill-current" />}
                                {selectedPlan === 'custom' ? 'Contactar Soporte' : `Siguiente Paso`}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center mb-8">
                            <div className="h-12 w-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-200">
                                <CreditCard size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Confirmar Detalles</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">Plan {selectedPlan.toUpperCase()} - {BILLING_PERIODS.find(p => p.id === billingPeriod)?.label}</p>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="RUT de Empresa o Persona"
                                icon={<Building2 size={18} />}
                                placeholder="12.345.678-9"
                                value={details.rut}
                                onChange={(e) => setDetails({ ...details, rut: e.target.value })}
                                className="font-bold border-slate-200"
                            />
                            <Input
                                label="Nombre Completo"
                                icon={<User size={18} />}
                                placeholder="Juan Pérez"
                                value={details.fullName}
                                onChange={(e) => setDetails({ ...details, fullName: e.target.value })}
                                className="font-bold border-slate-200"
                            />
                            <Input
                                label="Correo Electrónico de Contacto"
                                icon={<Mail size={18} />}
                                type="email"
                                placeholder="juan@ejemplo.com"
                                value={details.email}
                                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                                className="font-bold border-slate-200"
                            />
                        </div>

                        <div className="mt-8 flex gap-3">
                            <Button variant="ghost" className="flex-1 font-bold h-12" onClick={() => setStep('selection')} disabled={loading}>
                                Atrás
                            </Button>
                            <Button
                                className="flex-1 h-12 font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100"
                                onClick={handleRequestUpgrade}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={18} className="mr-2 fill-current" />}
                                Enviar Solicitud
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
