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
    const isCheckingRenewalRef = useRef(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    // Flag to suppress AuthContext's realtime refresh after optimistic updates from useNotifications
    const suppressGlobalRefreshRef = useRef(false);

    // Observer Mode / Impersonation
    const [isObserving, setIsObserving] = useState(false);
    const [observerData, setObserverData] = useState(null); // Stores original admin profile/user

    // Ref to prevent multiple simultaneous loads for the same user
    const loadingForUserId = useRef(null);

    const refreshUnreadNotifications = useCallback(async (overrideUserId) => {
        const targetId = overrideUserId || user?.id;
        if (!targetId) return;

        console.log('Auth: Refreshing unread notifications for:', targetId);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('id, is_read, type')
                .eq('user_id', targetId)
                .eq('is_read', false)
                .not('type', 'in', '(message,chat)');

            if (error) {
                console.error('Auth: Error refreshing unread notifications:', error);
                return;
            }

            // Use data length directly - most reliable method
            const newCount = data?.length || 0;
            console.log('Auth: Unread bell count for', targetId, '=', newCount);
            setUnreadNotifications(newCount);
        } catch (err) {
            console.error('Auth: Exception refreshing notifications:', err);
        }
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
                    // Blocking Check
                    if (data.status === 'blocked' && !isObserving) {
                        console.warn('Auth: User is blocked. Signing out.');
                        await signOut();
                        return;
                    }
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

                    // Auto-Downgrade Logic (3-day grace period)
                    if (data.plan !== 'free' && data.renewal_date) {
                        const renewalDate = new Date(data.renewal_date);
                        const gracePeriodEnd = new Date(renewalDate);
                        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

                        const now = new Date();
                        const isExpired = now >= new Date(renewalDate.getFullYear(), renewalDate.getMonth(), renewalDate.getDate());

                        if (now > gracePeriodEnd) {
                            console.warn('Auth: Renewal interval exceeded. Downgrading to FREE');
                            await handleAutoDowngrade(data);
                            // Refresh company data after downgrade
                            const { data: updatedCompany } = await supabase.from('companies').select('*').eq('id', data.id).single();
                            setCompany(updatedCompany);
                        } else if (isExpired) {
                            // In grace period - create notification if not already sent for this date
                            console.log('Auth: User is in grace period. renewal_date:', data.renewal_date);
                            setCompany(data);

                            // Simple, reliable deduplication: check if we already notified for this renewal date
                            const renewalDateStr = new Date(data.renewal_date).toISOString().split('T')[0];
                            const lastNotified = data.last_notified_renewal_date
                                ? new Date(data.last_notified_renewal_date).toISOString().split('T')[0]
                                : null;

                            if (lastNotified !== renewalDateStr) {
                                console.log('Auth: New grace period detected — creating notification');

                                // 1. Mark as notified FIRST to prevent duplicates
                                const { error: updateErr } = await supabase
                                    .from('companies')
                                    .update({ last_notified_renewal_date: data.renewal_date })
                                    .eq('id', data.id);

                                if (!updateErr) {
                                    // 2. Create the notification
                                    const { error: insertErr } = await supabase.from('notifications').insert({
                                        user_id: userId,
                                        type: 'grace_period',
                                        title: 'Suscripción por regularizar',
                                        content: `Tu suscripción venció el ${renewalDate.toLocaleDateString()}. Tienes 3 días para regularizar tu cuenta antes de que baje automáticamente al plan Gratis.`
                                    });

                                    if (!insertErr) {
                                        console.log('Auth: Grace period notification created successfully');
                                        // Refresh count after a short delay for DB consistency
                                        setTimeout(() => refreshUnreadNotifications(userId), 500);
                                    } else {
                                        console.error('Auth: Failed to insert notification:', insertErr);
                                    }
                                } else {
                                    console.error('Auth: Failed to update last_notified_renewal_date:', updateErr);
                                }
                            } else {
                                console.log('Auth: Already notified for this renewal date:', renewalDateStr);
                            }
                        }
                    }
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

    // Dedicated effect for real-time company status synchronization
    useEffect(() => {
        if (!user) return;

        console.log('Auth: Setting up company realtime sync for:', user.id);

        // Listen to ALL company updates — Supabase Realtime does NOT support UUID filters.
        // We filter in JavaScript instead.
        const channel = supabase
            .channel(`company-sync-${user.id}-${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'companies'
                },
                (payload) => {
                    // JS-side filter: only react to changes for THIS user's company
                    if (payload.new?.user_id !== user.id) return;

                    console.log('Auth: Company change detected! renewal_date:', payload.new.renewal_date);
                    setCompany(payload.new);
                    // Reload with delay for DB consistency
                    setTimeout(() => loadUserData(user.id, true), 500);
                }
            )
            .subscribe((status) => {
                console.log('Auth: Company realtime channel status:', status);
            });

        return () => {
            console.log('Auth: Cleaning up company realtime sync');
            supabase.removeChannel(channel);
        };
    }, [user]);

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
                    // Skip if useNotifications is handling this optimistically
                    if (suppressGlobalRefreshRef.current) {
                        console.log('Auth: Skipping refresh — suppressed by optimistic update');
                        return;
                    }
                    // Add a tiny delay to ensure DB consistency across nodes before fetching count
                    setTimeout(() => refreshUnreadNotifications(user.id), 300);
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
        const { data, error } = await supabase.auth.signInWithPassword(credentials);

        if (error) return { data, error };

        // Verification: Check if user is blocked immediately
        if (data?.user) {
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('status')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (profileError) {
                    console.error('Auth: Error checking profile status during sign-in:', profileError);
                } else if (profileData?.status === 'blocked') {
                    console.warn('Auth: Blocked user attempted login. Signing out.');
                    await supabase.auth.signOut();
                    return {
                        data: null,
                        error: {
                            message: 'Tu cuenta ha sido bloqueada por el administrador. Contacta a soporte para más información.',
                            isBlocked: true
                        }
                    };
                }

            } catch (err) {
                console.error('Auth: Exception during sign-in check:', err);
            }
        }

        return { data, error };
    };

    const signInWithSocial = async (provider) => {
        console.log('AuthContext: signInWithSocial called with provider:', provider);
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/login`
            }
        });
        return { data, error };
    };

    const resetPasswordForEmail = async (email) => {
        console.log('AuthContext: resetPasswordForEmail called for:', email);
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
    };

    const updatePassword = async (newPassword) => {
        console.log('AuthContext: updatePassword called');
        return await supabase.auth.updateUser({
            password: newPassword
        });
    };

    const signOut = async () => {
        setIsObserving(false);
        setObserverData(null);
        loadingForUserId.current = null;
        await supabase.auth.signOut();
        setProfile(null);
        setCompany(null);
        setPendingUpgrade(null);
        setUnreadNotifications(0);
    };

    const resendConfirmationEmail = async (email) => {
        console.log('AuthContext: resendConfirmationEmail called for:', email);
        return await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: `${window.location.origin}/login`
            }
        });
    };

    const handleAutoDowngrade = async (companyData) => {
        try {
            // 1. Update company plan
            await supabase.from('companies').update({ plan: 'free' }).eq('id', companyData.id);

            // 2. Hide excess products
            const { data: products } = await supabase
                .from('products')
                .select('id, active')
                .eq('company_id', companyData.id)
                .order('created_at', { ascending: true }); // Keep oldest active? Or based on order?

            // Hardcoded free limit or fetch from settings? 
            // Better to fetch from settings but if not available use 10 as safe default
            const freeLimit = 10; // Safe default for MVP

            if (products && products.length > freeLimit) {
                const excessIds = products.slice(freeLimit).map(p => p.id);
                await supabase.from('products').update({ active: false }).in('id', excessIds);
            }

            // 3. Create Notification (if not already notified for this event)
            if (!companyData.last_downgrade_notified_at) {
                await supabase.from('notifications').insert({
                    user_id: companyData.user_id,
                    type: 'downgrade',
                    title: 'Plan expirado',
                    content: 'Tu suscripción ha vencido y tu cuenta ha bajado a plan Gratis. Tus productos excedentes han sido ocultados temporalmente.'
                });

                // Update tracking column
                await supabase.from('companies')
                    .update({ last_downgrade_notified_at: new Date().toISOString() })
                    .eq('id', companyData.id);
            }

        } catch (err) {
            console.error('Auth: Error in auto-downgrade:', err);
        }
    };

    const startObserving = async (targetCompany) => {
        if (profile?.role !== 'admin') return;

        console.log('Auth: Starting observer mode for:', targetCompany.name);
        setObserverData({
            adminProfile: profile,
            adminUser: user
        });

        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetCompany.user_id)
            .single();

        setProfile(targetProfile);
        setCompany(targetCompany);
        setIsObserving(true);
    };

    // Observe any user (client or owner) — sets the admin to impersonate their profile
    const startObservingUser = async (targetProfile, targetCompany = null) => {
        if (profile?.role !== 'admin') return;

        console.log('Auth: Starting observer mode for user:', targetProfile.full_name || targetProfile.email);
        setObserverData({
            adminProfile: profile,
            adminUser: user
        });

        setProfile(targetProfile);
        setCompany(targetCompany);
        setIsObserving(true);
    };

    const stopObserving = () => {
        if (!isObserving || !observerData) return;
        console.log('Auth: Stopping observer mode');
        setProfile(observerData.adminProfile);
        // Refresh original admin company (though admins usually don't have one)
        refreshCompany();
        setIsObserving(false);
        setObserverData(null);
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
        signInWithSocial,
        signOut,
        resetPasswordForEmail,
        resendConfirmationEmail,
        updatePassword,
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
        suppressGlobalRefreshRef, // Used by useNotifications to suppress AuthContext realtime
        refreshUpgradeStatus,
        startObserving,
        startObservingUser,
        stopObserving,
        isObserving,
        observerData,
        loading
    }), [user, session, company, profile, pendingUpgrade, unreadNotifications, loading, isObserving, observerData]);

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
