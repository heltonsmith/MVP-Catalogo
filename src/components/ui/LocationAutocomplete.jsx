import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { ALL_LOCATION_STRINGS } from '../../utils/chileLocations';
import { cn } from '../../utils';

export function LocationAutocomplete({ value, onChange, placeholder = "Región o Ciudad...", className, inputClassName }) {
    const [inputValue, setInputValue] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val);
        onChange(val);

        if (val.length >= 2) {
            const lowVal = val.toLowerCase();
            const filtered = ALL_LOCATION_STRINGS.filter(loc =>
                loc.toLowerCase().includes(lowVal)
            ).slice(0, 8);
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelect = (suggestion) => {
        setInputValue(suggestion);
        onChange(suggestion);
        setShowSuggestions(false);
    };

    return (
        <div ref={containerRef} className={cn("relative group", className)}>
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 transition-colors group-focus-within:text-primary-500" />
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
                placeholder={placeholder}
                className={cn(
                    "w-full pl-12 pr-10 h-14 rounded-xl border-none focus:ring-2 focus:ring-primary-500 bg-transparent text-slate-900 font-medium placeholder:text-slate-400",
                    inputClassName
                )}
            />
            {inputValue && (
                <button
                    onClick={() => { setInputValue(''); onChange(''); setSuggestions([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 transition-colors"
                >
                    <X size={16} />
                </button>
            )}

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelect(s)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-primary-600 rounded-xl transition-all text-left group/item"
                            >
                                <div className="p-1.5 rounded-lg bg-slate-50 group-hover/item:bg-primary-50 transition-colors">
                                    <MapPin size={14} className="text-slate-400 group-hover/item:text-primary-500" />
                                </div>
                                <span>{s}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
