import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';

/**
 * Reusable SEO component for managing dynamic meta tags.
 * 
 * Uses a hybrid approach: Helmet for <title> + direct DOM manipulation
 * for meta tags to ensure they ALWAYS render in the DOM.
 * This fixes a known issue with react-helmet-async v2.x where
 * meta tags as JSX children may not inject into the DOM.
 */
export const SEO = ({
    title,
    description = "La plataforma definitiva para descubrir las mejores tiendas, mayoristas y catálogos en Chile. Encuentra lo que buscas con Ktaloog.com.",
    image = "https://www.ktaloog.com/og-image.png",
    url = "https://www.ktaloog.com",
    type = "website",
    keywords = "catálogo digital, mayoristas chile, tiendas online, buscador de tiendas, compras por mayor, ventas al detalle, ktaloog",
    author = "Ktaloog.com",
    noindex = false
}) => {
    const siteTitle = "Ktaloog.com - Catálogo Digital Inteligente";
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const seoImage = image || "https://www.ktaloog.com/og-image.png";
    const robotsContent = noindex ? "noindex, nofollow" : "index, follow";

    // Direct DOM manipulation to guarantee meta tags are present
    useEffect(() => {
        const setMeta = (attr, key, content) => {
            let el = document.querySelector(`meta[${attr}="${key}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, key);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        const setLink = (rel, href) => {
            let el = document.querySelector(`link[rel="${rel}"]`);
            if (!el) {
                el = document.createElement('link');
                el.setAttribute('rel', rel);
                document.head.appendChild(el);
            }
            el.setAttribute('href', href);
        };

        // Standard meta tags
        setMeta('name', 'description', description);
        setMeta('name', 'keywords', keywords);
        setMeta('name', 'author', author);
        setMeta('name', 'robots', robotsContent);

        // Open Graph
        setMeta('property', 'og:type', type);
        setMeta('property', 'og:title', fullTitle);
        setMeta('property', 'og:description', description);
        setMeta('property', 'og:image', seoImage);
        setMeta('property', 'og:url', url);
        setMeta('property', 'og:site_name', 'Ktaloog.com');

        // Twitter
        setMeta('name', 'twitter:card', 'summary_large_image');
        setMeta('name', 'twitter:title', fullTitle);
        setMeta('name', 'twitter:description', description);
        setMeta('name', 'twitter:image', seoImage);

        // Canonical
        setLink('canonical', url);

    }, [description, keywords, author, robotsContent, type, fullTitle, seoImage, url]);

    // Helmet still handles <title> reliably
    return (
        <Helmet>
            <title>{fullTitle}</title>
        </Helmet>
    );
};
