import { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    User,
    Mail,
    Phone,
    Calendar,
    Tag,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
    Filter,
    ArrowLeft,
    Send,
    X,
    Maximize2,
    MessageCircle,
    Store,
    Trash2,
    EyeOff
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useAdminTickets } from '../../hooks/useTickets';
import { useNotifications } from '../../hooks/useNotifications';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { cn } from '../../utils';
import { useSearchParams } from 'react-router-dom';

export default function AdminTickets() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const {
        tickets,
        loading,
        fetchTickets,
        fetchMessagesForTicket,
        updateStatus,
        sendAdminMessage,
        deleteTicket,
        scrollRef
    } = useAdminTickets();
    const { notifications, markTicketNotificationsAsRead } = useNotifications();


    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isDeleting, setIsDeleting] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState(null);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedTicket = tickets.find(t => t.id === selectedTicketId);

    // Ref to avoid infinite loops when marking notifications as read
    const lastMarkedRef = useRef(null);

    // When a ticket is selected, fetch its latest messages once
    useEffect(() => {
        if (selectedTicketId) {
            fetchMessagesForTicket(selectedTicketId);
            markTicketNotificationsAsRead(selectedTicketId);
            lastMarkedRef.current = selectedTicketId;
        }
    }, [selectedTicketId]); // eslint-disable-line react-hooks/exhaustive-deps

    // When new notifications arrive for the selected ticket, refresh messages
    useEffect(() => {
        if (!selectedTicketId) return;
        const unreadForTicket = notifications.filter(
            n => n.metadata?.ticket_id === selectedTicketId && (n.is_read === false || n.is_read === 'f')
        );
        if (unreadForTicket.length > 0) {
            fetchMessagesForTicket(selectedTicketId);
            markTicketNotificationsAsRead(selectedTicketId);
        }
    }, [notifications.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // Unified deep linking handler
    useEffect(() => {
        const ticketId = searchParams.get('ticket');
        if (!ticketId) return;

        // Fetch data if needed
        fetchTickets();

        // If we have tickets, try to select and clean up
        const ticketData = tickets.find(t => t.id === ticketId);
        if (ticketData) {
            setSelectedTicketId(ticketId);
            markTicketNotificationsAsRead(ticketId);

            // Clear URL param
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('ticket');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, tickets, fetchTickets, markTicketNotificationsAsRead, setSearchParams]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedTicket?.messages]);

    const handleReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        const text = replyText;
        setReplyText('');

        try {
            await sendAdminMessage(selectedTicket.id, text, user.id);
            showToast('Respuesta enviada', 'success');
        } catch (err) {
            showToast('Error al enviar respuesta', 'error');
        }
    };

    const updateTicketStatus = async (ticketId, newStatus) => {
        try {
            await updateStatus(ticketId, newStatus);
            showToast('Estado actualizado', 'success');
        } catch (err) {
            showToast('Error al actualizar estado', 'error');
        }
    };

    const handleDeleteTicket = async (ticketId) => {
        setTicketToDelete(ticketId);
    };

    const confirmDelete = async () => {
        if (!ticketToDelete) return;
        setIsDeleting(true);
        try {
            await deleteTicket(ticketToDelete);
            if (selectedTicketId === ticketToDelete) setSelectedTicketId(null);
            showToast('Ticket eliminado', 'success');
            setTicketToDelete(null);
        } catch (err) {
            showToast('Error al eliminar ticket', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusBadge = (status) => {
        // Map legacy status to the new simplified system
        const currentStatus = status === 'respondida' ? 'en_proceso' : status;

        switch (currentStatus) {
            case 'pendiente':
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pendiente</Badge>;
            case 'en_proceso':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">En proceso</Badge>;
            case 'finalizada':
                return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Finalizada</Badge>;
            default:
                return <Badge>{currentStatus.replace('_', ' ')}</Badge>;
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const groupedTickets = filteredTickets.reduce((groups, ticket) => {
        const key = ticket.company_name || `Cliente: ${ticket.display_name}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(ticket);
        return groups;
    }, {});

    const sortedGroupNames = Object.keys(groupedTickets).sort();

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Sistema de Tickets</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de soporte y atención al cliente.</p>
                </div>
            </div>

            {/* Compact Filters */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                placeholder="Buscar ticket..."
                                className="pl-9 h-10 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">TODOS LOS ESTADOS</option>
                            <option value="pendiente">PENDIENTES</option>
                            <option value="en_proceso">EN PROCESO</option>
                            <option value="finalizada">FINALIZADAS</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Compact Ticket List */}
            <div className="space-y-8">
                {sortedGroupNames.map(groupName => {
                    const isClientGroup = groupName.startsWith('Cliente:');
                    return (
                        <div key={groupName} className="space-y-3">
                            <div className="flex items-center gap-3 px-1">
                                {isClientGroup ? <User size={18} className="text-emerald-500" /> : <Store size={18} className="text-slate-400" />}
                                <h3 className="font-bold text-slate-800">{groupName}</h3>
                                <span className="h-px bg-slate-100 flex-1 ml-2" />
                                <Badge variant="outline" className="text-[10px] font-bold text-slate-400 border-slate-200 uppercase">
                                    {groupedTickets[groupName].length} TICKETS
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {groupedTickets[groupName].map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => {
                                            setSelectedTicketId(ticket.id);
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
                                                        const unreadCount = notifications.filter(n => n.metadata?.ticket_id === ticket.id && (n.is_read === false || n.is_read === 'f')).length;
                                                        return unreadCount > 0 && (
                                                            <span className="bg-rose-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm shadow-rose-200 animate-in zoom-in duration-200 shrink-0">
                                                                {unreadCount}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                    <p className="text-xs text-slate-500 truncate max-w-full sm:max-w-[300px]">{ticket.description}</p>
                                                    <span className="text-slate-200 hidden sm:inline">|</span>
                                                    <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{new Date(ticket.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
                                            <div className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado:</div>
                                            <div className="flex items-center gap-3">
                                                {ticket.is_deleted_by_user && (
                                                    <Badge className="bg-rose-50 text-rose-600 border-rose-100 flex items-center gap-1">
                                                        <EyeOff size={10} />
                                                        Oculto por cliente
                                                    </Badge>
                                                )}
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
                        </div>
                    );
                })}
            </div>

            {/* Modal Conversation with Margins */}
            {selectedTicket && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-0 md:p-10 animate-in fade-in duration-300">
                    <div className="bg-white w-full h-full max-w-7xl flex flex-col md:flex-row shadow-2xl md:rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-8 duration-500 relative">
                        {/* Modal Sidebar - User Info */}
                        <div className="hidden md:flex w-72 bg-slate-50 border-r border-slate-100 flex-col shrink-0">
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                <div>
                                    <h2 className="font-bold text-slate-900 mb-8">Información del Cliente</h2>
                                    <div className="flex flex-col items-center text-center">
                                        {selectedTicket.display_avatar ? (
                                            <img src={selectedTicket.display_avatar} alt={selectedTicket.display_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User size={40} />
                                        )}
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-xl">{selectedTicket.display_name}</h3>
                                    {selectedTicket.company_id && selectedTicket.customer_name && (
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            Contacto: {selectedTicket.customer_name}
                                        </p>
                                    )}
                                    {!selectedTicket.company_id && (
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">CLIENTE REGISTRADO</p>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200/50">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {selectedTicket.company_id ? 'Tienda Relacionada' : 'Estado del Cliente'}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                                            {selectedTicket.company_id ? (
                                                <>
                                                    <Store size={16} className="text-primary-500" />
                                                    {selectedTicket.company_name}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                    Cliente Activo
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                                            <Mail size={16} className="text-slate-400" />
                                            <span className="font-medium">{selectedTicket.customer_email || 'Sin correo'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                                            <Phone size={16} className="text-slate-400" />
                                            <span className="font-medium">{selectedTicket.display_whatsapp || 'Sin WhatsApp'}</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full h-11 border-slate-200 text-slate-600 font-bold text-sm bg-white hover:bg-slate-50"
                                        disabled={!selectedTicket.display_whatsapp}
                                        onClick={() => window.open(`https://wa.me/${selectedTicket.display_whatsapp.replace(/\D/g, '')}`, '_blank')}
                                    >
                                        Enviar WhatsApp
                                    </Button>
                                </div>

                                <div className="pt-8 border-t border-slate-200/50 pb-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Estado del Ticket</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {['pendiente', 'en_proceso', 'finalizada'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => updateTicketStatus(selectedTicket.id, status)}
                                                className={cn(
                                                    "flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                                                    selectedTicket.status === status
                                                        ? "bg-slate-900 text-white border-slate-900"
                                                        : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                                                )}
                                            >
                                                <span className="capitalize">{status.replace('_', ' ')}</span>
                                                {selectedTicket.status === status && <CheckCircle2 size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content - Chat History */}
                        <div className="flex-1 flex flex-col min-w-0 bg-white relative h-full">
                            {/* Chat Header */}
                            <header className="border-b border-slate-100 flex flex-col bg-white z-20 shrink-0">
                                <div className="h-14 px-4 md:h-20 md:px-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <button
                                            onClick={() => {
                                                setSelectedTicketId(null);
                                                setShowDetails(false);
                                            }}
                                            className="p-1.5 hover:bg-slate-50 rounded-full transition-colors md:hidden shrink-0"
                                        >
                                            <ArrowLeft size={20} className="text-slate-600" />
                                        </button>
                                        <div className="min-w-0">
                                            <h2 className="font-bold text-slate-900 truncate text-sm md:text-lg leading-tight">{selectedTicket.subject}</h2>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                {selectedTicket.display_name}
                                                {selectedTicket.company_id && ` (${selectedTicket.customer_name})`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedTicketId(null);
                                            setShowDetails(false);
                                        }}
                                        className="hidden md:flex p-3 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Mobile always-visible compact info strip */}
                                <div className="md:hidden border-t border-slate-100">
                                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
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
                                        <div className="bg-white border-t border-slate-100 p-4 space-y-4 animate-in slide-in-from-top duration-200">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                                                    <User size={24} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-slate-900 text-sm truncate">{selectedTicket.customer_name}</h3>
                                                    <p className="text-[9px] font-bold text-primary-500 uppercase tracking-widest truncate">{selectedTicket.user_id}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2 border-t border-slate-50 pt-3">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                                    {selectedTicket.company_id ? <Store size={14} className="text-primary-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                                                    {selectedTicket.company_name || 'Cliente Activo'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Mail size={14} className="text-slate-400" />
                                                    <span>{selectedTicket.customer_email || 'Sin correo'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {selectedTicket.whatsapp}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-slate-50 pt-3">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {new Date(selectedTicket.created_at).toLocaleDateString()}
                                                </div>
                                                {selectedTicket.status === 'finalizada' && (
                                                    <Button
                                                        variant="ghost"
                                                        className="h-7 px-2 text-rose-500 hover:bg-rose-50 font-bold text-[9px] flex items-center gap-1"
                                                        onClick={() => handleDeleteTicket(selectedTicket.id)}
                                                    >
                                                        <Trash2 size={12} />
                                                        Borrar
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {/* Mobile Status Changer */}
                                    <div className="flex items-center gap-1.5 px-4 py-2 bg-white border-t border-slate-50 overflow-x-auto">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Cambiar:</span>
                                        {['pendiente', 'en_proceso', 'finalizada'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => updateTicketStatus(selectedTicket.id, status)}
                                                className={cn(
                                                    "shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border capitalize",
                                                    selectedTicket.status === status
                                                        ? "bg-slate-900 text-white border-slate-900"
                                                        : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300"
                                                )}
                                            >
                                                {status.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
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
                                        <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
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
                                                        <span className="text-[10px] font-medium text-amber-700">Algunas imágenes antiguas no están disponibles para este ticket.</span>
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
                                            msg.sender === 'admin' ? "ml-auto items-end" : "mr-auto items-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-4 md:p-5 rounded-3xl shadow-sm relative group",
                                            msg.sender === 'admin'
                                                ? "bg-slate-900 text-white rounded-br-none"
                                                : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                                        )}>
                                            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                            <div className={cn(
                                                "mt-2 text-[10px] font-bold opacity-50 flex items-center gap-1",
                                                msg.sender === 'admin' ? "justify-end text-slate-300" : "text-slate-400"
                                            )}>
                                                <Calendar size={10} />
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest mx-2">
                                            {msg.sender === 'admin' ? 'Tú (ADMIN)' : selectedTicket.customer_name}
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
                                            <p className="text-slate-400 text-xs text-balance">No se pueden enviar más respuestas a una conversación cerrada.</p>
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
                                                    onClick={() => setSelectedTicketId(null)}
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
            )
            }

            {/* Image Lightbox */}
            {
                selectedImage && (
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
                )
            }
            <ConfirmationModal
                isOpen={!!ticketToDelete}
                onClose={() => setTicketToDelete(null)}
                onConfirm={confirmDelete}
                loading={isDeleting}
                title="¿Eliminar este ticket?"
                description="Esta acción es permanente y no se podrá recuperar la conversación ni los archivos adjuntos."
                confirmText="Eliminar permanentemente"
                cancelText="Mantener ticket"
            />
        </div >
    );
}
