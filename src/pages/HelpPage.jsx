import { useState, useEffect, useRef } from 'react';
import {
    HelpCircle,
    MessageSquare,
    Send,
    CheckCircle2,
    LifeBuoy,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Plus,
    Clock,
    User,
    ArrowLeft,
    MessageCircle,
    X,
    Filter,
    Calendar,
    AlertCircle,
    Maximize2,
    Store,
    Mail,
    Phone,
    Image as ImageIcon,
    Upload,
    Trash2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { TextArea } from '../components/ui/TextArea';
import { useToast } from '../components/ui/Toast';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils';
import { useTickets } from '../hooks/useTickets';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../lib/supabase';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function HelpPage() {
    const { getSetting, loading: settingsLoading } = useSettings();
    const { showToast } = useToast();
    const { user, profile, company } = useAuth();
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState('faq'); // 'faq' or 'tickets'
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [ticketToDelete, setTicketToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { notifications, markTicketNotificationsAsRead } = useNotifications();

    // Form state for new ticket
    const [newTicket, setNewTicket] = useState({
        type: 'soporte',
        subject: '',
        description: '',
        photos: []
    });

    const proProductLimit = getSetting('pro_plan_product_limit', '500');
    const proImageLimit = getSetting('pro_plan_image_limit', '5');

    const { tickets: userTickets, loading: ticketsLoading, fetchTickets, fetchMessagesForTicket, createTicket, sendMessage, deleteTicket, scrollRef } = useTickets(user?.id);

    const faqs = [
        { q: '¿Cómo subo mis productos?', a: 'Desde tu Panel Admin, ve a "Productos" y haz clic en "Nuevo Producto". Solo necesitas nombre, precio y fotos. El proceso es instantáneo.' },
        { q: '¿Mis clientes necesitan una app?', a: 'No, tus clientes entran a través de un enlace web o escaneando tu código QR. Funciona en cualquier navegador de móvil o PC sin descargar nada.' },
        { q: '¿Cómo recibo las ventas?', a: 'ktaloog es un catálogo inteligente. Los clientes eligen productos y te envían el pedido directamente a tu WhatsApp o por el chat interno de la plataforma.' },
        { q: '¿Qué incluye el plan Pro?', a: `Es nuestro plan más potente. Permite hasta ${proProductLimit} productos, ${proImageLimit} fotos por cada uno, chat integrado, QR personalizado y prioridad en soporte.` },
        { q: '¿Puedo cambiar de plan después?', a: '¡Por supuesto! Puedes subir o bajar de plan en cualquier momento desde tu configuración. Si bajas de plan, tus productos excedentes se ocultarán pero nunca se borrarán.' },
        { q: '¿Cómo funciona el código QR?', a: 'Generamos un código QR único para tu tienda. Puedes imprimirlo y ponerlo en tus mesas o local; al escanearlo, los clientes verán tu menú o catálogo al instante.' },
        { q: '¿Es seguro mi catálogo?', a: 'Totalmente. Utilizamos infraestructura de alta seguridad y cifrada para asegurar que tus fotos, precios y datos de clientes estén protegidos 24/7.' },
        { q: '¿Qué formas de pago puedo usar?', a: 'ktaloog facilita la muestra de productos. El pago final lo coordinas directamente con tu cliente mediante transferencia o efectivo según lo acuerden por WhatsApp.' },
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedTicket?.messages]);

    // Handle deep linking ?ticket=ID
    useEffect(() => {
        const ticketId = searchParams.get('ticket');
        if (ticketId) {
            // Force a refresh from DB to ensure we have the latest messages
            fetchTickets();

            if (userTickets.length > 0) {
                const ticket = userTickets.find(t => t.id === ticketId);
                if (ticket) {
                    setSelectedTicket(ticket);
                    setActiveTab('tickets');
                    // Clear param after use
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('ticket');
                    setSearchParams(newParams, { replace: true });
                }
            }
        }
    }, [searchParams, userTickets.length > 0, fetchTickets]);

    // When new notifications arrive for the selected ticket, refresh messages
    useEffect(() => {
        if (!selectedTicket?.id) return;
        const unreadForTicket = notifications.filter(
            n => n.metadata?.ticket_id === selectedTicket.id && (n.is_read === false || n.is_read === 'f')
        );
        if (unreadForTicket.length > 0) {
            fetchMessagesForTicket(selectedTicket.id);
            markTicketNotificationsAsRead(selectedTicket.id);
        }
    }, [notifications.length, selectedTicket?.id, fetchMessagesForTicket]);

    // When a ticket is selected, immediately fetch its latest messages
    useEffect(() => {
        if (selectedTicket?.id) {
            fetchMessagesForTicket(selectedTicket.id);
            markTicketNotificationsAsRead(selectedTicket.id);
        }
    }, [selectedTicket?.id, fetchMessagesForTicket]);

    // Keep selectedTicket in sync with userTickets for real-time updates
    useEffect(() => {
        if (selectedTicket) {
            const updated = userTickets.find(t => t.id === selectedTicket.id);
            if (updated) {
                // Only update if there's an actual change to avoid loops
                if (JSON.stringify(updated) !== JSON.stringify(selectedTicket)) {
                    setSelectedTicket(updated);
                }
            }
        }
    }, [userTickets, selectedTicket]);

    const handleCreateTicketClick = () => {
        if (!user) {
            showToast('Solo usuarios registrados pueden generar ticket', 'error');
            return;
        }
        if (profile?.role === 'admin') {
            showToast('Los administradores deben gestionar tickets desde el Panel Admin', 'info');
            return;
        }
        setIsCreateModalOpen(true);
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        if (newTicket.photos.length + files.length > 3) {
            showToast("Máximo 3 imágenes permitidas", "error");
            return;
        }

        const newPhotos = files.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }));

        setNewTicket(prev => ({
            ...prev,
            photos: [...prev.photos, ...newPhotos]
        }));
    };

    const removePhoto = (index) => {
        const photoToRemove = newTicket.photos[index];
        if (photoToRemove?.previewUrl) {
            URL.revokeObjectURL(photoToRemove.previewUrl);
        }
        setNewTicket(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    const handleReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        const text = replyText;
        setReplyText('');

        try {
            // Optimistic update for the open modal
            setSelectedTicket(prev => ({
                ...prev,
                messages: [
                    ...prev.messages,
                    {
                        id: crypto.randomUUID(),
                        sender: 'client',
                        text,
                        timestamp: new Date().toISOString()
                    }
                ]
            }));

            await sendMessage(selectedTicket.id, text);
            showToast('Respuesta enviada', 'success');
        } catch (err) {
            showToast('Error al enviar respuesta', 'error');
        }
    };

    const handleDeleteTicket = (ticketId) => {
        setTicketToDelete(ticketId);
    };

    const confirmDelete = async () => {
        if (!ticketToDelete) return;
        setIsDeleting(true);
        try {
            await deleteTicket(ticketToDelete);
            if (selectedTicket?.id === ticketToDelete) {
                setSelectedTicket(null);
                setShowDetails(false);
            }
            showToast('Ticket removido de tu historial', 'success');
            setTicketToDelete(null);
        } catch (err) {
            showToast('Error al eliminar ticket', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusBadge = (status) => {
        // Map legacy status to the new simplified system
        const currentStatus = (status === 'respondida' || status === 'respondido' || status === 'esperando_respuesta')
            ? 'en_proceso'
            : status;

        switch (currentStatus) {
            case 'pendiente':
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pendiente</Badge>;
            case 'en_proceso':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">En proceso</Badge>;
            case 'finalizada':
            case 'terminado':
                return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Terminado</Badge>;
            default:
                return <Badge>{currentStatus.replace('_', ' ')}</Badge>;
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const uploadedUrls = [];

            // 1. Upload photos if any
            for (const photoObj of newTicket.photos) {
                const file = photoObj.file;
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `tickets/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('support-attachments')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('support-attachments')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
            }

            // 2. Create ticket with public URLs
            await createTicket({
                type: newTicket.type,
                subject: newTicket.subject,
                description: newTicket.description,
                company_id: company?.id,
                photos: uploadedUrls
            });

            // 3. Cleanup
            newTicket.photos.forEach(p => URL.revokeObjectURL(p.previewUrl));
            setIsCreateModalOpen(false);
            setNewTicket({ type: 'soporte', subject: '', description: '', photos: [] });
            showToast('Ticket creado correctamente', 'success');
        } catch (err) {
            console.error('Error creating ticket:', err);
            showToast('Error al crear ticket', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-20 overflow-x-hidden">
            {/* Simple Header */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-8 px-4">
                <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
                    <div className="h-14 w-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 mb-4">
                        <LifeBuoy size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Centro de Ayuda</h1>
                    <p className="mt-2 text-slate-500 max-w-lg">Resolvemos tus dudas para que lleves tu negocio al siguiente nivel.</p>

                    {/* Navigation Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl mt-8">
                        <button
                            onClick={() => setActiveTab('faq')}
                            className={cn(
                                "px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2",
                                activeTab === 'faq' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <HelpCircle size={18} />
                            Preguntas Frecuentes
                        </button>
                        <button
                            onClick={() => setActiveTab('tickets')}
                            className={cn(
                                "px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2",
                                activeTab === 'tickets' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <MessageSquare size={18} />
                            Mis Tickets
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto mt-12 px-4 sm:px-6">
                {activeTab === 'faq' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {faqs.map((faq, i) => (
                                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-start gap-4">
                                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-primary-500 transition-colors">
                                            <ChevronRight size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                            <h2 className="text-xl font-bold text-slate-900">Historial de Soporte</h2>
                            <Button
                                onClick={handleCreateTicketClick}
                                className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-primary-100 w-full sm:w-auto justify-center py-6 sm:py-2"
                            >
                                <Plus size={18} />
                                Generar Ticket
                            </Button>
                        </div>

                        {profile?.role === 'admin' ? (
                            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center max-w-2xl mx-auto shadow-sm">
                                <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mx-auto mb-6">
                                    <AlertCircle size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Panel de Administración</h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4">
                                    Como administrador, no generas tickets de soporte personales en esta sección.
                                    Para ver, responder y gestionar todos los tickets de la plataforma, por favor dirígete al Panel de Administración.
                                </p>
                                <Button
                                    onClick={() => navigate('/admin/tickets')}
                                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl h-14 px-10 shadow-lg shadow-primary-100"
                                >
                                    Ir al Panel de Tickets
                                </Button>
                            </div>
                        ) : userTickets.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center">
                                <MessageCircle size={48} className="mx-auto text-slate-200 mb-4" />
                                <h3 className="text-lg font-bold text-slate-800 mb-1">No tienes tickets aún</h3>
                                <p className="text-slate-500 text-sm">Si tienes algún problema, estaremos encantados de ayudarte.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {userTickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => {
                                            setSelectedTicket(ticket);
                                            markTicketNotificationsAsRead(ticket.id);
                                        }}
                                        className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:border-primary-200 hover:shadow-md transition-all cursor-pointer group gap-4 sm:gap-0"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                                ticket.status === 'pendiente' ? "bg-amber-50 text-amber-500" :
                                                    ticket.status === 'en_proceso' ? "bg-blue-50 text-blue-500" :
                                                        "bg-slate-50 text-slate-400"
                                            )}>
                                                <MessageSquare size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center flex-wrap gap-2 mb-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{ticket.id}</span>
                                                    <span className="text-slate-300 hidden sm:inline">•</span>
                                                    <span className="text-xs font-bold text-slate-700 truncate block sm:inline w-full sm:w-auto">{ticket.subject}</span>
                                                    {(() => {
                                                        const unread = notifications.filter(
                                                            n => n.metadata?.ticket_id === ticket.id && (n.is_read === false || n.is_read === 'f')
                                                        ).length;
                                                        return unread > 0 ? (
                                                            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                                                                {unread}
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                    <p className="text-xs text-slate-500 truncate max-w-full sm:max-w-[300px]">{ticket.description}</p>
                                                    <span className="text-slate-200 hidden sm:inline">|</span>
                                                    <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{new Date(ticket.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                                            <div className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado:</div>
                                            <div className="flex items-center gap-3">
                                                {getStatusBadge(ticket.status)}
                                                <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity text-primary-500">
                                                    <Maximize2 size={18} />
                                                </div>
                                                {ticket.status === 'finalizada' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteTicket(ticket.id); }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                        title="Eliminar ticket"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Conversation - Admin Style */}
            {selectedTicket && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-0 md:p-10 animate-in fade-in duration-300 overflow-hidden">
                    <div className="bg-white w-full h-full md:h-[85vh] max-w-7xl flex flex-col md:flex-row shadow-2xl md:rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-8 duration-500 relative">
                        {/* Modal Sidebar - Ticket Info */}
                        <div className="hidden md:flex w-72 bg-slate-50 border-r border-slate-100 flex-col shrink-0">
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                <div>
                                    <h2 className="font-bold text-slate-900 mb-8">Información del Ticket</h2>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-300 border border-slate-100 mb-4">
                                            <LifeBuoy size={40} className="text-primary-500" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-xl">Soporte Ktaloog</h3>
                                        <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-1">SOPORTE OFICIAL</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200/50">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asunto</p>
                                        <div className="text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                                            {selectedTicket.subject}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría</p>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                                            <Badge variant="outline" className="text-[10px] font-bold uppercase border-slate-200">
                                                {selectedTicket.type}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado Actual</p>
                                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                                            {getStatusBadge(selectedTicket.status)}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Delete button for finalized tickets */}
                            {selectedTicket.status === 'finalizada' && (
                                <div className="pt-4">
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 border-rose-100 text-rose-500 hover:bg-rose-50 font-bold text-sm flex items-center gap-2"
                                        onClick={() => handleDeleteTicket(selectedTicket.id)}
                                    >
                                        <Trash2 size={16} />
                                        Eliminar Ticket
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Modal Content - Chat History */}
                        <div className="flex-1 flex flex-col min-w-0 bg-white relative h-full">
                            {/* Chat Header */}
                            <header className="border-b border-slate-100 flex flex-col bg-white z-20 shrink-0">
                                <div className="h-14 px-4 md:h-20 md:px-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <button
                                            onClick={() => {
                                                setSelectedTicket(null);
                                                setShowDetails(false);
                                            }}
                                            className="p-1.5 hover:bg-slate-50 rounded-full transition-colors md:hidden shrink-0"
                                        >
                                            <ArrowLeft size={20} className="text-slate-600" />
                                        </button>
                                        <div className="min-w-0">
                                            <h2 className="font-bold text-slate-900 truncate text-sm md:text-lg leading-tight">{selectedTicket.subject}</h2>
                                            <p className="text-[10px] text-slate-400 md:flex items-center gap-1 mt-0.5 hidden">
                                                <Clock size={10} /> Soporte Ktaloog
                                            </p>
                                            <p className="text-[10px] text-slate-400 flex md:hidden items-center gap-1 mt-0.5">
                                                Soporte Ktaloog
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => console.log('DEBUG: Selected Ticket Raw Data:', selectedTicket)}
                                        className="hidden md:block p-3 text-slate-100 hover:text-slate-200 transition-colors"
                                        title="Debug Data"
                                    >
                                        <Filter size={14} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedTicket(null);
                                            setShowDetails(false);
                                        }}
                                        className="hidden md:flex p-3 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Mobile always-visible compact info strip */}
                                <div className="md:hidden flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <div className="scale-[0.8] origin-left">{getStatusBadge(selectedTicket.status)}</div>
                                        </div>
                                        <span className="text-slate-200">|</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-slate-600 capitalize">{selectedTicket.type}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDetails(!showDetails)}
                                        className="flex items-center gap-1 text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg"
                                    >
                                        {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        {showDetails ? 'Ocultar' : 'Detalles'}
                                    </button>
                                </div>

                                {/* Mobile Collapsible Details */}
                                {showDetails && (
                                    <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 animate-in slide-in-from-top duration-200">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">IDC: {selectedTicket.id}</p>
                                            <div className="text-xs font-bold text-slate-700">
                                                {selectedTicket.subject}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-slate-50 pt-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={10} />
                                                Creado: {new Date(selectedTicket.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={10} />
                                                Soporte Ktaloog
                                            </div>
                                        </div>
                                        {selectedTicket.status === 'finalizada' && (
                                            <Button
                                                variant="outline"
                                                className="w-full h-9 border-rose-100 text-rose-500 hover:bg-rose-50 font-bold text-[10px] flex items-center gap-2"
                                                onClick={() => handleDeleteTicket(selectedTicket.id)}
                                            >
                                                <Trash2 size={14} />
                                                Eliminar Ticket
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </header>

                            {/* Chat Body */}
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
                            >
                                {/* Initial Ticket Description */}
                                <div className="flex flex-col items-center mb-12">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm max-w-2xl w-full">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DESCRIPCIÓN ORIGINAL</span>
                                        </div>
                                        <p className="text-slate-700 font-medium leading-relaxed">
                                            {selectedTicket.description}
                                        </p>

                                        {selectedTicket.photos && selectedTicket.photos.length > 0 && (
                                            <div className="mt-6 flex flex-wrap gap-3">
                                                {selectedTicket.photos.filter(p => !p.startsWith('blob:')).map((photo, i) => (
                                                    <div key={i} className="h-24 w-24 rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:scale-105 transition-transform cursor-zoom-in" onClick={() => setSelectedImage(photo)}>
                                                        <img src={photo} className="h-full w-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Error'} />
                                                    </div>
                                                ))}
                                                {selectedTicket.photos.some(p => p.startsWith('blob:')) && (
                                                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-100 mt-2">
                                                        <AlertCircle className="text-amber-500" size={14} />
                                                        <span className="text-[10px] font-medium text-amber-700">Algunas imágenes antiguas no están disponibles.</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Conversation Thread */}
                                {selectedTicket.messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex flex-col max-w-[80%]",
                                            msg.sender === 'client' ? "ml-auto items-end" : "mr-auto items-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-4 md:p-5 rounded-3xl shadow-sm relative group",
                                            msg.sender === 'client'
                                                ? "bg-primary-600 text-white rounded-br-none"
                                                : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                                        )}>
                                            <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                                            <div className={cn(
                                                "mt-2 text-[10px] font-bold opacity-50 flex items-center gap-1",
                                                msg.sender === 'client' ? "justify-end text-primary-100" : "text-slate-400"
                                            )}>
                                                <Calendar size={10} />
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest mx-2">
                                            {msg.sender === 'client' ? 'Tú (Cliente)' : 'Admin Soporte'}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Area */}
                            <footer className="p-3 md:p-8 bg-white border-t border-slate-100 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] shrink-0">
                                <div className="max-w-4xl mx-auto flex flex-col gap-2 md:gap-4">
                                    {selectedTicket.status === 'finalizada' ? (
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <p className="text-slate-600 font-bold mb-1">Este ticket ha sido finalizado</p>
                                            <p className="text-slate-400 text-xs text-balance">Nuestro equipo de soporte ha cerrado este caso. Si tienes más dudas, por favor genera un nuevo ticket.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative group">
                                                <TextArea
                                                    placeholder="Escribe tu respuesta aquí..."
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    className="min-h-[56px] md:min-h-[120px] rounded-xl md:rounded-3xl border-slate-200 focus:ring-primary-500 pr-10 text-sm md:text-base shadow-sm group-hover:border-slate-300 transition-all resize-none p-3 md:p-6"
                                                />
                                                <div className="absolute top-3 right-3 text-slate-200 group-focus-within:text-primary-200 transition-colors">
                                                    <MessageCircle size={18} className="md:w-7 md:h-7" />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="h-9 px-4 text-xs border-slate-200 text-slate-600 font-bold rounded-xl md:hidden"
                                                    onClick={() => { setSelectedTicket(null); setShowDetails(false); }}
                                                >
                                                    Cerrar
                                                </Button>
                                                <Button
                                                    onClick={handleReply}
                                                    disabled={!replyText.trim()}
                                                    className="h-9 md:h-12 px-5 md:px-8 bg-primary-600 hover:bg-primary-700 text-white text-xs md:text-sm font-bold rounded-xl md:rounded-2xl shadow-md shadow-primary-100 flex items-center gap-1.5 group transition-all transform active:scale-95"
                                                >
                                                    <Send size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                                    Enviar
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Ticket Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 md:p-12 animate-in zoom-in-95 duration-200 relative my-auto">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-10 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 mx-auto mb-4">
                                <Plus size={32} />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900">¿Cómo podemos ayudarte?</h2>
                            <p className="text-slate-500 mt-2">Dinos qué necesitas y nuestro equipo te responderá lo antes posible.</p>
                        </div>

                        <form className="space-y-6" onSubmit={handleCreateTicket}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Categoría</label>
                                    <div className="relative">
                                        <select
                                            value={newTicket.type}
                                            onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none"
                                        >
                                            <option value="soporte">Soporte Técnico</option>
                                            <option value="reclamo">Reclamo / Queja</option>
                                            <option value="felicitaciones">Felicitaciones</option>
                                            <option value="consultas">Consultas Generales</option>
                                        </select>
                                        <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Asunto</label>
                                    <Input
                                        placeholder="Ej: Problemas con mi tienda"
                                        className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-sm font-medium px-5"
                                        value={newTicket.subject}
                                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Descripción detallada</label>
                                <TextArea
                                    className="min-h-[150px] bg-slate-50 border-slate-100 rounded-3xl p-6 text-sm leading-relaxed"
                                    placeholder="Explica detalladamente tu situación aquí..."
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Archivos adjuntos (Máx 3)</label>
                                    <span className="text-[10px] font-bold text-slate-300">{newTicket.photos.length}/3 imágenes</span>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    {newTicket.photos.map((photo, index) => (
                                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group">
                                            <img src={photo.previewUrl} className="h-full w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {newTicket.photos.length < 3 && (
                                        <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer group">
                                            <Upload size={20} className="text-slate-400 group-hover:text-primary-500" />
                                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-primary-500">Subir</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-16 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-[1.5rem] shadow-xl shadow-primary-100 text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            Enviar Ticket de Soporte
                                            <Send size={20} />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Image Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200 cursor-zoom-out"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 p-3 text-white/50 hover:text-white transition-colors"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={selectedImage}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!ticketToDelete}
                onClose={() => setTicketToDelete(null)}
                onConfirm={confirmDelete}
                loading={isDeleting}
                title="¿Eliminar ticket del historial?"
                description="Tú ya no verás este ticket, pero seguirá registrado en nuestro sistema de soporte."
                confirmText="Eliminar de mi vista"
                cancelText="Mantener ticket"
            />
        </div>
    );
}
