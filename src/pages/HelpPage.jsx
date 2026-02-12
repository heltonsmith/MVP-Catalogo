import { useState } from 'react';
import { HelpCircle, MessageSquare, Send, CheckCircle2, LifeBuoy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export default function HelpPage() {
    const { showToast } = useToast();
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
            showToast('Ticket de soporte enviado correctamente. Te contactaremos pronto.', 'success');
        }, 1500);
    };

    const faqs = [
        { q: '¿Cómo subo mis productos?', a: 'Desde tu Panel Admin, ve a "Productos" y haz clic en "Nuevo Producto". Solo necesitas nombre, precio y una foto.' },
        { q: '¿Mis clientes necesitan una app?', a: 'No, tus clientes entran a través de un enlace web o escaneando tu código QR. Funciona en cualquier navegador.' },
        { q: '¿Cómo recibo las ventas?', a: 'ktaloog es un catálogo. Los clientes te enviarán sus pedidos o consultas directamente a tu WhatsApp o chat interno.' },
        { q: '¿Qué incluye el plan Pro?', a: 'Productos ilimitados, todas las fotos, sistema de mensajería, código QR, chat integrado y prioridad en soporte.' },
    ];

    return (
        <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <LifeBuoy className="mx-auto h-12 w-12 text-primary-600 mb-4" />
                    <h1 className="text-4xl font-extrabold text-slate-900">Centro de Ayuda</h1>
                    <p className="mt-4 text-lg text-slate-500">Estamos aquí para ayudarte a hacer crecer tu negocio.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* FAQs */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                            <HelpCircle className="text-primary-600" />
                            Preguntas Frecuentes
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {faqs.map((faq, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support Form */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <MessageSquare size={80} className="text-primary-600" />
                        </div>

                        {!submitted ? (
                            <>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Soporte Directo</h2>
                                <p className="text-slate-500 text-sm mb-6">Si no encuentras lo que buscas, abre un ticket de soporte.</p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                        <Input placeholder="Tu nombre" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                        <Input type="email" placeholder="correo@ejemplo.com" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Mensaje</label>
                                        <textarea
                                            className="w-full rounded-xl border-slate-200 focus:border-primary-500 focus:ring-primary-500 text-sm min-h-[120px] p-3 border"
                                            placeholder="¿En qué podemos ayudarte?"
                                            required
                                        ></textarea>
                                    </div>
                                    <Button className="w-full h-11 font-bold gap-2" disabled={loading}>
                                        {loading ? 'Enviando...' : (
                                            <>
                                                <Send size={18} />
                                                Enviar Ticket
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Recibido!</h3>
                                <p className="text-slate-500 mb-8">Hemos registrado tu ticket de soporte. Un experto se pondrá en contacto contigo en las próximas 24 horas.</p>
                                <Button variant="secondary" onClick={() => setSubmitted(false)}>Enviar otro mensaje</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
