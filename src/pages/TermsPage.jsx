import { ShieldAlert, BookOpen, Scale } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="bg-slate-50 min-h-screen py-16 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-primary-600 p-8 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <Scale size={32} />
                        <h1 className="text-3xl font-bold text-white">Aspectos Legales</h1>
                    </div>
                    <p className="text-white/80 font-medium tracking-wide">Última actualización: 12 de Febrero, 2026</p>
                </div>

                <div className="p-8 sm:p-12 space-y-8 text-slate-600 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <BookOpen className="text-primary-600" size={20} />
                            1. Naturaleza del Servicio
                        </h2>
                        <p>
                            ktaloog es una plataforma tecnológica que proporciona herramientas para la creación y visualización de catálogos digitales para empresas y emprendedores.
                        </p>
                        <blockquote className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-r-xl">
                            <strong>IMPORTANTE:</strong> ktaloog <strong>NO es una plataforma de comercio electrónico transaccional</strong>. Nosotros no procesamos pagos, no gestionamos inventarios logísticos ni intermediamos en la compraventa de productos.
                        </blockquote>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ShieldAlert className="text-primary-600" size={20} />
                            2. Exención de Responsabilidad de Pagos
                        </h2>
                        <p>
                            Cualquier transacción comercial iniciada a través de ktaloog (incluyendo cotizaciones enviadas por WhatsApp o mensajes internos) es responsabilidad exclusiva entre el Vendedor y el Comprador.
                        </p>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li>No existe intercambio de dinero dentro de nuestra plataforma.</li>
                            <li>No guardamos información de tarjetas de crédito o cuentas bancarias de compradores.</li>
                            <li>No nos hacemos responsables por estafas, productos defectuosos o incumplimiento de servicios por parte de las tiendas listadas.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">3. Responsabilidad del Contenido</h2>
                        <p>
                            Las tiendas son responsables de la veracidad de la información, precios, imágenes y disponibilidad de los productos mostrados en su catálogo.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">4. Propiedad Intelectual</h2>
                        <p>
                            ktaloog respeta los derechos de autor. Los usuarios mantienen la propiedad de sus contenidos, pero otorgan a la plataforma una licencia para mostrarlos dentro del servicio contratado.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-slate-100 text-center text-sm text-slate-400">
                        <p>Al utilizar ktaloog, aceptas estos términos en su totalidad.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
