import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

const withTimeout = (promise, ms, defaultValue = null) => {
    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => {
            // Only log warning if it's a long timeout (likely a real issue)
            if (ms > 5000) {
                console.warn(`Auth: Timeout after ${ms}ms - continuing with default value`);
            }
            resolve(defaultValue);
        }, ms))
    ]);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState(null);
    const [profile, setProfile] = useState(null);
    const [pendingUpgrade, setPendingUpgrade] = useState(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    // Ref to prevent multiple simultaneous loads for the same user
    const loadingForUserId = useRef(null);

    const refreshUnreadNotifications = useCallback(async (overrideUserId) => {
        const targetId = overrideUserId || user?.id;
        if (!targetId) {
            console.log('Auth: Skip refresh, no targetId');
            return;
        }

        console.log('Auth: Refreshing unread notifications for:', targetId);
        const { data, count, error } = await supabase
            .from('notifications')
            .select('id, is_read', { count: 'exact' })
            .eq('user_id', targetId)
            .eq('is_read', false);

        if (error) {
            console.error('Auth: Error refreshing unread notifications:', error);
            return;
        }

        console.log('Auth: Raw data returned:', data?.length || 0, 'rows. Count header:', count);
        // Robust boolean filtering
        const unreadRows = (data || []).filter(n => n.is_read === false || n.is_read === 'f');
        const newCount = count !== null ? count : unreadRows.length;

        console.log('Auth: New count for', targetId, 'is', newCount);
        setUnreadNotifications(newCount);
    }, [user]);

    const loadUserData = async (userId, force = false) => {
        if (!userId || (!force && loadingForUserId.current === userId)) return;
        loadingForUserId.current = userId;

        console.log('Auth: Triggering data load for:', userId);
        try {
            const fetchProfile = async () => {
                const query = supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
                const { data } = await withTimeout(query, 4000, { data: null });
                if (data) {
                    setProfile(data);
                } else {
                    setProfile(null);
                }
            };

            const fetchCompany = async () => {
                const query = supabase.from('companies').select('*').eq('user_id', userId).maybeSingle();
                const { data } = await withTimeout(query, 4000, { data: null });
                if (data) {
                    console.log('Auth: Company loaded');
                    setCompany(data);
                } else {
                    console.log('Auth: No company found for this user');
                    setCompany(null);
                }
            };

            const fetchPendingUpgrade = async (companyId) => {
                if (!companyId) return;
                const { data } = await supabase
                    .from('upgrade_requests')
                    .select('*')
                    .eq('company_id', companyId)
                    .eq('status', 'pending')
                    .maybeSingle();
                setPendingUpgrade(data);
            };

            const fetchUnreadNotifications = async () => {
                await refreshUnreadNotifications(userId);
            };

            await Promise.allSettled([fetchProfile(), fetchCompany(), fetchUnreadNotifications()]);

            // Fetch pending upgrade after company is loaded
            if (loadingForUserId.current === userId) {
                const { data: companyData } = await supabase.from('companies').select('id').eq('user_id', userId).maybeSingle();
                if (companyData) {
                    await fetchPendingUpgrade(companyData.id);
                }
            }
        } catch (error) {
            console.error('Auth: Load error:', error);
        } finally {
            console.log('Auth: Load process completed');
            loadingForUserId.current = null; // Clear ref so it can be reloaded if needed
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        // Safety: Global timeout to ensure "Cargando..." never stays forever
        const globalTimeout = setTimeout(() => {
            if (isMounted && loading) {
                console.log('Auth: Global safety timeout reached');
                setLoading(false);
            }
        }, 10000);

        const init = async () => {
            console.log('Auth: Running initialization...');
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (isMounted) {
                    const currentUser = session?.user ?? null;
                    setSession(session);
                    setUser(currentUser);

                    if (currentUser) {
                        await loadUserData(currentUser.id);
                    } else {
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error('Auth: Initialization error:', err);
                if (isMounted) setLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth: State change event:', event);
            if (!isMounted) return;

            const currentUser = session?.user ?? null;
            setSession(session);
            setUser(currentUser);

            if (currentUser) {
                loadUserData(currentUser.id);
            } else {
                loadingForUserId.current = null;
                setProfile(null);
                setCompany(null);
                setUnreadNotifications(0);
                setLoading(false);
            }
        });

        init();

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(globalTimeout);
        };
    }, []);

    // Dedicated effect for real-time notifications with auto-reconnect + polling fallback
    useEffect(() => {
        if (!user) return;

        console.log('Auth: Setting up notifications subscription for:', user.id);

        let channelRef = null;
        let reconnectTimer = null;
        let isMounted = true;

        const setupChannel = () => {
            if (!isMounted) return;

            // Remove old channel if exists
            if (channelRef) {
                supabase.removeChannel(channelRef);
                channelRef = null;
            }

            channelRef = supabase
                .channel(`global:notifications:${user.id}:${Date.now()}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    console.log('Auth: Notification event captured!', payload.eventType, payload.new?.id);
                    refreshUnreadNotifications(user.id);
                })
                .subscribe((status) => {
                    console.log('Auth: Notification channel status:', status);
                    if (status === 'SUBSCRIBED') {
                        refreshUnreadNotifications(user.id);
                        // Clear any pending reconnect timer
                        if (reconnectTimer) {
                            clearTimeout(reconnectTimer);
                            reconnectTimer = null;
                        }
                    } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        console.warn('Auth: Channel failed with status:', status, '— scheduling reconnect in 5s');
                        // Immediately poll to ensure count is fresh
                        refreshUnreadNotifications(user.id);
                        // Schedule reconnect
                        if (isMounted && !reconnectTimer) {
                            reconnectTimer = setTimeout(() => {
                                reconnectTimer = null;
                                console.log('Auth: Reconnecting notification channel...');
                                setupChannel();
                            }, 5000);
                        }
                    }
                });
        };

        setupChannel();

        // Polling fallback: refresh every 30s in case realtime is unreliable
        const pollInterval = setInterval(() => {
            if (isMounted) refreshUnreadNotifications(user.id);
        }, 30000);

        return () => {
            isMounted = false;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            clearInterval(pollInterval);
            if (channelRef) {
                console.log('Auth: Removing notifications subscription for:', user.id);
                supabase.removeChannel(channelRef);
            }
        };
    }, [user?.id, refreshUnreadNotifications]);

    const signIn = async (credentials) => {
        console.log('AuthContext: signIn called');
        return await supabase.auth.signInWithPassword(credentials);
    };

    const signOut = async () => {
        loadingForUserId.current = null;
        await supabase.auth.signOut();
        setProfile(null);
        setCompany(null);
        setPendingUpgrade(null);
        setUnreadNotifications(0);
    };


    const refreshCompany = async () => {
        if (user) {
            await loadUserData(user.id, true);
        }
    };

    const refreshUpgradeStatus = async () => {
        if (company?.id) {
            const { data } = await supabase
                .from('upgrade_requests')
                .select('*')
                .eq('company_id', company.id)
                .eq('status', 'pending')
                .maybeSingle();
            setPendingUpgrade(data);
        }
    };


    const value = useMemo(() => ({
        signUp: (data) => supabase.auth.signUp(data),
        signIn,
        signOut,
        refreshCompany,
        refreshProfile: refreshCompany,
        user,
        session,
        company,
        profile,
        pendingUpgrade,
        unreadNotifications,
        setUnreadNotifications, // Exposed for optimistic updates
        refreshUnreadNotifications,
        refreshUpgradeStatus,
        loading
    }), [user, session, company, profile, pendingUpgrade, unreadNotifications, loading]);

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex min-h-screen items-center justify-center bg-slate-50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600"></div>
                        <p className="text-sm font-medium text-slate-500 animate-pulse">Iniciando plataforma...</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
