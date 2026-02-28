import { ShieldCheck, Lock, EyeOff, Server, HardDrive, Bell } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="bg-slate-50 min-h-screen py-16 px-4">
                        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-primary-600 p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <ShieldCheck size={32} />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-white">Política de Privacidad</h1>
                        </div>
                        <p className="text-white/90 font-medium max-w-xl">
                            En ktaloog, la seguridad de tus datos y la privacidad de tu negocio son nuestra máxima prioridad.
                        </p>
                        <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/80">
                            <Bell size={14} />
                            Última actualización: 21 de Febrero, 2026
                        </div>
                    </div>
                </div>

                <div className="p-8 sm:p-14 space-y-12 text-slate-600 leading-relaxed">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-900 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary-600">
                                <Lock size={20} />
                            </div>
                            <h2 className="text-2xl font-bold">1. Datos Personales y Seguridad</h2>
                        </div>
                        <p>
                            Recopilamos la información estrictamente necesaria para que puedas gestionar tu catálogo y comunicarte con tus clientes. Toda la información personal y comercial está protegida bajo estándares de seguridad de nivel bancario.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                <h3 className="font-bold text-slate-900 mb-2">Encriptación de Punto a Punto</h3>
                                <p className="text-sm">Toda la comunicación entre tu navegador y nuestros servidores viaja a través de túneles TLS/SSL de 256 bits, asegurando que nadie pueda interceptar tus datos.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                <h3 className="font-bold text-slate-900 mb-2">Base de Datos Protegida</h3>
                                <p className="text-sm">Utilizamos infraestructura líder en la industria (Supabase/PostgreSQL) con políticas de seguridad de nivel de fila (RLS) para garantizar que cada usuario solo acceda a lo que le corresponde.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-900 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary-600">
                                <EyeOff size={20} />
                            </div>
                            <h2 className="text-2xl font-bold">2. Tratamiento de la Información</h2>
                        </div>
                        <p>
                            Tus datos le pertenecen a **ti**. ktaloog no vende, alquila ni comercializa tu información ni la de tus clientes con terceros.
                        </p>
                        <ul className="space-y-4 mt-4">
                            <li className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                                <div>
                                    <span className="font-bold text-slate-800">Uso Operativo:</span> Utilizamos tu información para proporcionarte el servicio, gestionar tus suscripciones y enviarte notificaciones críticas sobre tu cuenta.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                                <div>
                                    <span className="font-bold text-slate-800">Transparencia:</span> Solo compartiremos información si es requerido por ley o para proteger la integridad de nuestros usuarios frente a actividades fraudulentas.
                                </div>
                            </li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-4 text-slate-900 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary-600">
                                <Server size={20} />
                            </div>
                            <h2 className="text-2xl font-bold">3. Infraestructura y Almacenamiento</h2>
                        </div>
                        <div className="bg-primary-50 border border-primary-100 rounded-3xl p-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-primary-600">
                                    <HardDrive size={24} />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-bold text-primary-900">Seguridad Predictiva</p>
                                    <p className="text-primary-800 text-sm">
                                        Nuestros servidores cuentan con monitoreo 24/7 y sistemas de firewall inteligentes que bloquean automáticamente intentos de intrusión y ataques DDoS.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="pt-8 border-t border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">4. Tus Derechos</h2>
                        <p className="mb-6">
                            Tienes derecho a acceder, rectificar o eliminar tu información en cualquier momento desde tu panel de configuración o contactando a nuestro soporte técnico.
                        </p>
                        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900 text-sm">
                            <p className="font-bold mb-1">¿Dudas sobre tus datos?</p>
                            Escríbenos directamente a través de nuestro Centro de Ayuda o al correo electrónico de soporte. Estamos aquí para proteger tu negocio.
                        </div>
                    </section>

                    <div className="text-center pt-8">
                        <div className="inline-block p-1 bg-slate-50 rounded-full px-6 py-2 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={12} className="text-primary-500" />
                                Al usar ktaloog, tus datos están a salvo
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
