import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll the main window
        window.scrollTo(0, 0);

        // Also scroll any overflow containers that might be the actual scrollable elements
        // This handles layouts where the page uses overflow-y-auto on inner containers
        requestAnimationFrame(() => {
            // Target common scrollable containers in the app
            const scrollables = document.querySelectorAll(
                'main, [class*="overflow-y-auto"], [class*="overflow-auto"]'
            );
            scrollables.forEach(el => {
                if (el.scrollTop > 0) {
                    el.scrollTo(0, 0);
                }
            });
        });
    }, [pathname]);

    return null;
}
