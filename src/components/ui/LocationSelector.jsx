import { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { CHILE_LOCATIONS } from '../../utils/chileLocations';
import { cn } from '../../utils';

export function LocationSelector({ value, onChange, className, labelClassName }) {
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    useEffect(() => {
        if (value) {
            const parts = value.split(', ');
            if (parts.length === 2) {
                setSelectedCity(parts[0]);
                setSelectedRegion(parts[1]);
            } else {
                setSelectedRegion(value);
                setSelectedCity('');
            }
        } else {
            setSelectedRegion('');
            setSelectedCity('');
        }
    }, [value]);

    const handleRegionChange = (e) => {
        const region = e.target.value;
        setSelectedRegion(region);
        setSelectedCity('');
        onChange(region);
    };

    const handleCityChange = (e) => {
        const city = e.target.value;
        setSelectedCity(city);
        if (city) {
            onChange(`${city}, ${selectedRegion}`);
        } else {
            onChange(selectedRegion);
        }
    };

    const cities = CHILE_LOCATIONS.find(r => r.region === selectedRegion)?.cities || [];

    const isAllRegions = selectedRegion === 'Todas las regiones';

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3", className)}>
            <div className="space-y-1.5">
                <label className={cn("text-xs font-bold text-slate-500 uppercase tracking-wider", labelClassName)}>Región</label>
                <div className="relative group">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                    <select
                        value={selectedRegion}
                        onChange={handleRegionChange}
                        className="w-full pl-9 pr-10 h-10 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
                    >
                        <option value="">Selecciona Región</option>
                        <option value="Todas las regiones">Todas las regiones</option>
                        {CHILE_LOCATIONS.map(r => (
                            <option key={r.region} value={r.region}>{r.region}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className={cn("text-xs font-bold text-slate-500 uppercase tracking-wider", labelClassName)}>Comuna / Ciudad</label>
                <div className="relative group">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
                    <select
                        value={selectedCity}
                        onChange={handleCityChange}
                        disabled={!selectedRegion || isAllRegions}
                        className="w-full pl-9 pr-10 h-10 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        <option value="">
                            {isAllRegions
                                ? 'Todas las comunas'
                                : selectedRegion
                                    ? 'Todas las comunas'
                                    : 'Primero elige región'
                            }
                        </option>
                        {cities.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
