import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll the main window
        window.scrollTo(0, 0);

        // Scroll the app's main container (which has overflow-y-auto)
        const mainContainer = document.getElementById('main-scroll-container');
        if (mainContainer) {
            mainContainer.scrollTo(0, 0);
        }

        // Also reset any inner scrollable elements (dashboard mains, etc.)
        document.querySelectorAll('main').forEach(el => {
            if (el.scrollTop > 0) el.scrollTo(0, 0);
        });
    }, [pathname]);

    return null;
}
