import { useState, useEffect } from 'react';
import { Settings, RefreshCw, AlertTriangle, ShieldOff, Loader2, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
import { cn } from '../../utils';

export default function AdminSystemControls() {
    const { showToast } = useToast();
    const { settings, loading: settingsLoading, refreshSettings } = useSettings();

    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [pendingMaintenanceValue, setPendingMaintenanceValue] = useState(false);

    useEffect(() => {
        if (settings) {
            setMaintenanceMode(settings.MAINTENANCE_MODE === 'true');
        }
    }, [settings]);

    const handleToggleMaintenance = (e) => {
        const newValue = e.target.checked;
        setPendingMaintenanceValue(newValue);
        setIsMaintenanceModalOpen(true);
    };

    const confirmMaintenanceToggle = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('system_config')
                .upsert({
                    key: 'MAINTENANCE_MODE',
                    value: String(pendingMaintenanceValue),
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setMaintenanceMode(pendingMaintenanceValue);
            await refreshSettings();
            showToast(`Modo mantenimiento ${pendingMaintenanceValue ? 'ACTIVADO' : 'DESACTIVADO'}`, 'success');
        } catch (error) {
            console.error('Error toggling maintenance:', error);
            showToast('Error al cambiar el modo mantenimiento', 'error');
        } finally {
            setLoading(false);
            setIsMaintenanceModalOpen(false);
        }
    };

    const handleForceReset = () => {
        setIsResetModalOpen(true);
    };

    const confirmForceReset = async () => {
        setLoading(true);
        try {
            const timestamp = new Date().toISOString();
            const { error } = await supabase
                .from('system_config')
                .upsert({
                    key: 'FORCE_RESET_TIMESTAMP',
                    value: timestamp,
                    updated_at: timestamp
                });

            if (error) throw error;

            showToast('Reinicio del sistema enviado con éxito', 'success');
            // reload after a short delay to ensure toast is seen
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error('Error triggering reset:', error);
            showToast('Error al enviar el reinicio del sistema', 'error');
        } finally {
            setLoading(false);
            setIsResetModalOpen(false);
        }
    };

    if (settingsLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className="mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="text-primary-600" />
                    Controles de Sistema
                </h1>
                <p className="text-slate-500 text-sm mt-1">Herramientas de administración crítica para el mantenimiento de la plataforma</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Maintenance Mode Card */}
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-xl",
                                    maintenanceMode ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                                )}>
                                    <ShieldOff size={20} />
                                </div>
                                <div>
                                    <CardTitle>Modo Mantenimiento</CardTitle>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Site-Wide Access Control</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={maintenanceMode}
                                    onChange={handleToggleMaintenance}
                                    disabled={loading}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 text-slate-600">
                            <div className="flex-1">
                                <p className="text-sm font-medium leading-relaxed">
                                    Cuando está activo, todos los usuarios (excepto administradores) verán una pantalla de mantenimiento y no podrán acceder a la plataforma.
                                    <span className="text-amber-600 font-bold block mt-1 italic">
                                        * No afecta a las sesiones de administrador activas.
                                    </span>
                                </p>
                            </div>
                            <div className={cn(
                                "px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest",
                                maintenanceMode
                                    ? "bg-amber-100 text-amber-700 animate-pulse border border-amber-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                            )}>
                                {maintenanceMode ? 'Sistema en Mantenimiento' : 'Sistema Operativo'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Force Reset Card */}
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                                <RefreshCw size={20} />
                            </div>
                            <div>
                                <CardTitle>Reinicio del Sistema (Global)</CardTitle>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Flush Sessions & Storage</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-4 items-start">
                                <AlertTriangle className="text-rose-600 shrink-0" size={24} />
                                <div className="text-sm">
                                    <p className="font-bold text-rose-900 mb-1">Acción Crítica e irreversible</p>
                                    <p className="text-rose-700 font-medium">
                                        Esta acción forzará el cierre de sesión de **TODOS** los usuarios conectados y limpiará su almacenamiento local (caché).
                                        Se utiliza después de actualizaciones críticas para asegurar que nadie use versiones obsoletas de la plataforma.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="danger"
                                    className="gap-2 h-12 shadow-lg shadow-rose-100"
                                    onClick={handleForceReset}
                                    disabled={loading}
                                >
                                    <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                                    Forzar Reinicio Global
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={isMaintenanceModalOpen}
                onClose={() => setIsMaintenanceModalOpen(false)}
                onConfirm={confirmMaintenanceToggle}
                loading={loading}
                title={pendingMaintenanceValue ? "Activar Modo Mantenimiento" : "Desactivar Modo Mantenimiento"}
                description={pendingMaintenanceValue
                    ? "¿Seguro que deseas poner el sistema en mantenimiento? Los usuarios no podrán entrar hasta que lo desactives."
                    : "¿Deseas restaurar el acceso normal a la plataforma para todos los usuarios?"}
                confirmText={pendingMaintenanceValue ? "Activar Mantenimiento" : "Restaurar Acceso"}
                variant={pendingMaintenanceValue ? "warning" : "primary"}
            />

            <ConfirmationModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={confirmForceReset}
                loading={loading}
                title="¿Forzar Reinicio Global?"
                description="Esto cerrará la sesión de todos los usuarios actuales y limpiará su caché. Deberán volver a iniciar sesión. Se recomienda hacer esto solo en horarios de bajo tráfico."
                confirmText="Forzar Reinicio Ahora"
                variant="danger"
            />
        </div>
    );
}
