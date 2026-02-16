import { useAuth } from '../context/AuthContext';

export function useUpgradeRequest() {
    const { pendingUpgrade, loading, refreshUpgradeStatus } = useAuth();

    return {
        pendingRequest: pendingUpgrade,
        loading,
        refresh: refreshUpgradeStatus
    };
}
