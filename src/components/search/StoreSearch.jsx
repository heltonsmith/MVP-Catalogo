import { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { LocationSelector } from '../ui/LocationSelector';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../../utils';

export function StoreSearch({ className, onSearch, initialSearch = '', initialLocation = '' }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Initialize state from props or URL params
    const [search, setSearch] = useState(initialSearch || searchParams.get('q') || '');
    const [location, setLocation] = useState(initialLocation || searchParams.get('location') || '');

    // Synchronize local state if URL changes (useful when navigating back/forward)
    useEffect(() => {
        const q = searchParams.get('q');
        const loc = searchParams.get('location');
        if (q !== null) setSearch(q);
        if (loc !== null) setLocation(loc);
    }, [searchParams]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // If an onSearch prop is provided (e.g., from Explorer page), call it
        if (onSearch) {
            onSearch({ search, location });
        } else {
            // Otherwise, navigate to the explorer page with query params
            const params = new URLSearchParams();
            if (search) params.set('q', search);
            if (location) params.set('location', location);
            navigate(`/explorar?${params.toString()}`);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "bg-white p-3 rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 flex flex-col md:flex-row gap-3 relative z-10",
                className
            )}
        >
            {/* Search Input */}
            <div className="w-full md:flex-1 relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 h-6 w-6 transition-colors group-focus-within:text-primary-500 pointer-events-none" />
                <input
                    type="text"
                    placeholder="¿Qué buscas? (Tiendas, restaurantes...)"
                    className="w-full pl-14 pr-4 h-14 md:h-16 rounded-2xl border-none focus:ring-0 bg-transparent text-slate-900 font-bold text-lg placeholder:text-slate-400 truncate"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Desktop Divide */}
            <div className="w-px bg-slate-100 hidden md:block my-3" />

            {/* Location Selector */}
            <div className="w-full md:w-[350px] lg:w-[420px] shrink-0">
                <LocationSelector
                    value={location}
                    onChange={setLocation}
                    className="h-full !gap-3"
                    labelClassName="hidden"
                />
            </div>

            {/* Search Button */}
            <Button
                type="submit"
                className="w-full md:w-auto h-14 md:h-16 px-10 rounded-2xl shrink-0 font-black text-lg shadow-lg shadow-primary-200 mt-2 md:mt-0"
            >
                Explorar
            </Button>
        </form>
    );
}
