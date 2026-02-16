import { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
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

    const loadUserData = async (userId, force = false) => {
        if (!userId || (!force && loadingForUserId.current === userId)) return;
        loadingForUserId.current = userId;

        console.log('Auth: Triggering data load for:', userId);
        try {
            const fetchProfile = async () => {
                const query = supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
                const { data } = await withTimeout(query, 15000, { data: null });
                if (data) {
                    setProfile(data);
                } else {
                    setProfile(null);
                }
            };

            const fetchCompany = async () => {
                const query = supabase.from('companies').select('*').eq('user_id', userId).maybeSingle();
                const { data } = await withTimeout(query, 15000, { data: null });
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
                const { count, error } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('is_read', false);

                if (!error) {
                    setUnreadNotifications(count || 0);
                }
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
        }, 20000);

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

                // Set up real-time unread count
                const channel = supabase
                    .channel(`unread-notifications-${currentUser.id}`)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${currentUser.id}`
                    }, async () => {
                        const { count } = await supabase
                            .from('notifications')
                            .select('*', { count: 'exact', head: true })
                            .eq('user_id', currentUser.id)
                            .eq('is_read', false);
                        setUnreadNotifications(count || 0);
                    })
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
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

    const refreshUnreadNotifications = async () => {
        if (!user) return;
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (!error) {
            setUnreadNotifications(count || 0);
        }
    };

    const value = useMemo(() => ({
        signUp: (data) => supabase.auth.signUp(data),
        signIn,
        signOut,
        refreshCompany,
        user,
        session,
        company,
        profile,
        pendingUpgrade,
        unreadNotifications,
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
