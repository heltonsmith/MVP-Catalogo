import { useState, useEffect } from 'react';
import { Globe, Shield, Cloud, Save, Loader2, Package, Camera, Zap, Sparkles, Crown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
import { cn } from '../../utils';

export default function AdminSettings() {
    const { showToast } = useToast();
    const { settings, loading: settingsLoading, refreshSettings } = useSettings();
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState({
        platform_name: 'ktaloog',
        support_email: 'soporte@ktaloog.cl',
        base_url: 'https://ktaloog.cl',
        free_plan_product_limit: '5',
        free_plan_image_limit: '1',
        plus_plan_product_limit: '100',
        plus_plan_image_limit: '5',
        plus_plan_price_monthly: '9990',
        plus_plan_price_semester: '8500',
        plus_plan_price_annual: '7000',
        pro_plan_product_limit: '500',
        pro_plan_image_limit: '5',
        pro_plan_price_monthly: '19990',
        pro_plan_price_semester: '18000',
        pro_plan_price_annual: '16000',
        custom_plan_product_limit: '1000',
        custom_plan_image_limit: '10'
    });

    useEffect(() => {
        if (settings) {
            setFormData({
                platform_name: settings.platform_name || 'ktaloog',
                support_email: settings.support_email || 'soporte@ktaloog.cl',
                base_url: settings.base_url || 'https://ktaloog.cl',
                free_plan_product_limit: settings.free_plan_product_limit || '5',
                free_plan_image_limit: settings.free_plan_image_limit || '1',
                plus_plan_product_limit: settings.plus_plan_product_limit || '100',
                plus_plan_image_limit: settings.plus_plan_image_limit || '5',
                plus_plan_price_monthly: settings.plus_plan_price_monthly || '9990',
                plus_plan_price_semester: settings.plus_plan_price_semester || '8500',
                plus_plan_price_annual: settings.plus_plan_price_annual || '7000',
                pro_plan_product_limit: settings.pro_plan_product_limit || '500',
                pro_plan_image_limit: settings.pro_plan_image_limit || '5',
                pro_plan_price_monthly: settings.pro_plan_price_monthly || '19990',
                pro_plan_price_semester: settings.pro_plan_price_semester || '18000',
                pro_plan_price_annual: settings.pro_plan_price_annual || '16000',
                custom_plan_product_limit: settings.custom_plan_product_limit || '1000',
                custom_plan_image_limit: settings.custom_plan_image_limit || '10'
            });
        }
    }, [settings]);

    const handleInputChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = Object.entries(formData).map(([key, value]) => ({
                key,
                value: String(value),
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('system_config')
                .upsert(updates);

            if (error) throw error;

            await refreshSettings();
            showToast('Configuraciones guardadas correctamente.', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('No se pudieron guardar las configuraciones.', 'error');
        } finally {
            setSaving(false);
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
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Configuración del Sistema</h1>
                <p className="text-slate-500 text-sm mt-1">Gestiona los parámetros globales y planes de la plataforma</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-100 rounded-2xl w-fit">
                {[
                    { id: 'general', label: 'General', icon: Globe },
                    { id: 'free', label: 'Plan Gratis', icon: Shield },
                    { id: 'plus', label: 'Plan Plus', icon: Zap },
                    { id: 'pro', label: 'Plan Pro', icon: Sparkles },
                    { id: 'custom', label: 'Plan Custom', icon: Crown },
                    { id: 'integrations', label: 'Integraciones', icon: Cloud },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-white text-primary-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-6 pb-24">
                {activeTab === 'general' && (
                    <Card className="border-none shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <CardHeader className="border-b border-slate-50">
                            <div className="flex items-center gap-2">
                                <Globe size={20} className="text-primary-600" />
                                <CardTitle>Configuración General</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Plataforma</label>
                                    <Input
                                        value={formData.platform_name}
                                        onChange={(e) => handleInputChange('platform_name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email de Soporte</label>
                                    <Input
                                        value={formData.support_email}
                                        onChange={(e) => handleInputChange('support_email', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">URL Base</label>
                                    <Input
                                        value={formData.base_url}
                                        onChange={(e) => handleInputChange('base_url', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Versión del Sistema</label>
                                    <Input defaultValue="v1.2.0-stable" disabled />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'free' && (
                    <Card className="border-none shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <CardHeader className="border-b border-slate-50">
                            <div className="flex items-center gap-2">
                                <Shield size={20} className="text-secondary-600" />
                                <CardTitle>Límites Plan Gratis</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="font-bold text-slate-900 text-sm mb-4">Productos Máximos</p>
                                    <Input
                                        type="number"
                                        value={formData.free_plan_product_limit}
                                        onChange={(e) => handleInputChange('free_plan_product_limit', e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="font-bold text-slate-900 text-sm mb-4">Imágenes por Producto</p>
                                    <Input
                                        type="number"
                                        value={formData.free_plan_image_limit}
                                        onChange={(e) => handleInputChange('free_plan_image_limit', e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'plus' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-none shadow-sm">
                            <CardHeader className="border-b border-slate-50">
                                <div className="flex items-center gap-2">
                                    <Zap size={20} className="text-primary-600" />
                                    <CardTitle>Límites Plan Plus</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-primary-50/30 rounded-2xl border border-primary-100">
                                        <p className="font-bold text-slate-900 text-sm mb-4">Productos Máximos</p>
                                        <Input
                                            type="number"
                                            value={formData.plus_plan_product_limit}
                                            onChange={(e) => handleInputChange('plus_plan_product_limit', e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="p-4 bg-primary-50/30 rounded-2xl border border-primary-100">
                                        <p className="font-bold text-slate-900 text-sm mb-4">Imágenes por Producto</p>
                                        <Input
                                            type="number"
                                            value={formData.plus_plan_image_limit}
                                            onChange={(e) => handleInputChange('plus_plan_image_limit', e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader className="border-b border-slate-50">
                                <div className="flex items-center gap-2">
                                    <DollarSign size={20} className="text-primary-600" />
                                    <CardTitle>Precios Plan Plus</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-4 bg-primary-50/30 rounded-2xl border border-primary-100">
                                        <p className="font-bold text-slate-900 text-sm mb-4">Precio Mensual</p>
                                        <Input
                                            type="number"
                                            value={formData.plus_plan_price_monthly}
                                            onChange={(e) => handleInputChange('plus_plan_price_monthly', e.target.value)}
                                            className="bg-white"
                                            placeholder="9990"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Precio base mensual en CLP</p>
                                    </div>
                                    <div className="p-4 bg-primary-50/30 rounded-2xl border border-primary-100">
                                        <p className="font-bold text-slate-900 text-sm mb-4">Precio Semestral</p>
                                        <Input
                                            type="number"
                                            value={formData.plus_plan_price_semester}
                                            onChange={(e) => handleInputChange('plus_plan_price_semester', e.target.value)}
                                            className="bg-white"
                                            placeholder="8500"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Precio mensual equivalente (6 meses)</p>
                                    </div>
                                    <div className="p-4 bg-primary-50/30 rounded-2xl border border-primary-100">
                                        <p className="font-bold text-slate-900 text-sm mb-4">Precio Anual</p>
                                        <Input
                                            type="number"
                                            value={formData.plus_plan_price_annual}
                                            onChange={(e) => handleInputChange('plus_plan_price_annual', e.target.value)}
                                            className="bg-white"
                                            placeholder="7000"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Precio mensual equivalente (12 meses)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'pro' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-none shadow-sm">
                            <CardHeader className="border-b border-slate-50">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={20} className="text-amber-500" />
                                    <CardTitle>Límites Plan Pro</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
                                        <p className="font-bold text-slate-900 text-sm mb-4">Productos Máximos</p>
                                        <Input
                                            type="number"
                                            value={formData.pro_plan_product_limit}
                                            onChange={(e) => handleInputChange('pro_plan_product_limit', e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
                                        <p className="font-bold text-slate-900 text-sm mb-4">Imágenes por Producto</p>
                                        <Input
                                            type="number"
                                            value={formData.pro_plan_image_limit}
                                            onChange={(e) => handleInputChange('pro_plan_image_limit', e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader className="border-b border-slate-50">
                                <div className="flex items-center gap-2">
                                    <DollarSign size={20} className="text-amber-600" />
                                    <CardTitle>Precios Plan Pro</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
                                        <p className="font-bold text-slate-900 text-sm mb-4">Precio Mensual</p>
                                        <Input
                                            type="number"
                                            value={formData.pro_plan_price_monthly}
                                            onChange={(e) => handleInputChange('pro_plan_price_monthly', e.target.value)}
                                            className="bg-white"
                                            placeholder="19990"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Precio base mensual en CLP</p>
                                    </div>
                                    <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
                                        <p className="font-bold text-slate-900 text-sm mb-4">Precio Semestral</p>
                                        <Input
                                            type="number"
                                            value={formData.pro_plan_price_semester}
                                            onChange={(e) => handleInputChange('pro_plan_price_semester', e.target.value)}
                                            className="bg-white"
                                            placeholder="18000"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Precio mensual equivalente (6 meses)</p>
                                    </div>
                                    <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
                                        <p className="font-bold text-slate-900 text-sm mb-4">Precio Anual</p>
                                        <Input
                                            type="number"
                                            value={formData.pro_plan_price_annual}
                                            onChange={(e) => handleInputChange('pro_plan_price_annual', e.target.value)}
                                            className="bg-white"
                                            placeholder="16000"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">Precio mensual equivalente (12 meses)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'custom' && (
                    <Card className="border-none shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <CardHeader className="border-b border-slate-50">
                            <div className="flex items-center gap-2">
                                <Crown size={20} className="text-purple-600" />
                                <CardTitle>Límites Plan Custom</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100">
                                    <p className="font-bold text-slate-900 text-sm mb-4">Productos Máximos</p>
                                    <Input
                                        type="number"
                                        value={formData.custom_plan_product_limit}
                                        onChange={(e) => handleInputChange('custom_plan_product_limit', e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100">
                                    <p className="font-bold text-slate-900 text-sm mb-4">Imágenes por Producto</p>
                                    <Input
                                        type="number"
                                        value={formData.custom_plan_image_limit}
                                        onChange={(e) => handleInputChange('custom_plan_image_limit', e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'integrations' && (
                    <Card className="border-none shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <CardHeader className="border-b border-slate-50">
                            <div className="flex items-center gap-2">
                                <Cloud size={20} className="text-primary-600" />
                                <CardTitle>Integraciones</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4 text-center py-12">
                            <p className="text-slate-400 text-sm">No hay integraciones activas en este momento.</p>
                            <Button variant="secondary" size="sm" disabled>Configurar Webhooks</Button>
                        </CardContent>
                    </Card>
                )}

                {/* Fixed Save Bar (Mobile Friendly) */}
                <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-40 flex justify-end animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="max-w-4xl w-full mx-auto flex justify-end px-4 md:px-8">
                        <Button
                            className="w-full sm:w-auto gap-2 h-12 sm:h-auto shadow-lg shadow-primary-500/20"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {saving ? 'Guardando...' : 'Guardar Todos los Cambios'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
