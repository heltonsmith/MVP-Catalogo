import { Helmet } from 'react-helmet-async';

/**
 * Reusable SEO component for managing dynamic meta tags.
 * 
 * @param {Object} props
 * @param {string} props.title - The page title
 * @param {string} props.description - The meta description
 * @param {string} props.image - The open graph image URL
 * @param {string} props.url - The canonical URL
 * @param {string} props.type - The open graph type (website, profile, etc.)
 */
export const SEO = ({
    title,
    description = "La plataforma definitiva para descubrir las mejores tiendas, mayoristas y catálogos en Chile. Encuentra lo que buscas con Ktaloog.com.",
    image = "https://www.ktaloog.com/og-image.png",
    url = "https://www.ktaloog.com",
    type = "website"
}) => {
    const siteTitle = "Ktaloog.com - Catálogo Digital Inteligente";
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

    return (
        <Helmet>
            {/* Standard tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />
            <meta property="og:site_name" content="Ktaloog.com" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Additional SEO tags */}
            <meta name="keywords" content="catálogo digital, mayoristas chile, tiendas online, buscador de tiendas, compras por mayor, ventas al detalle, ktaloog" />
            <meta name="author" content="Ktaloog.com" />
            <meta name="robots" content="index, follow" />
        </Helmet>
    );
};
