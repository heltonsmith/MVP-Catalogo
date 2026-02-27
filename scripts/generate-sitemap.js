import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = 'https://www.ktaloog.com';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateSitemap() {
    console.log('🚀 Iniciando generación de sitemap dinámico...');

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Error: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas.');
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Static Routes
    const staticRoutes = [
        '',
        '/explorar',
        '/registro',
        '/login',
        '/precios',
        '/nosotros',
        '/ayuda',
        '/terminos',
        '/privacidad'
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add Static Routes
    staticRoutes.forEach(route => {
        sitemap += `
  <url>
    <loc>${SITE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    try {
        // 2. Dynamic Store Routes (Companies)
        console.log('📦 Obteniendo tiendas...');
        const { data: companies, error: compError } = await supabase
            .from('companies')
            .select('slug, updated_at');

        if (compError) throw compError;

        companies?.forEach(company => {
            sitemap += `
  <url>
    <loc>${SITE_URL}/catalogo/${company.slug}</loc>
    <lastmod>${new Date(company.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
        });

        // 3. Dynamic Product Routes
        console.log('📦 Obteniendo productos...');
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('slug, updated_at, companies(slug)')
            .eq('is_active', true);

        if (prodError) throw prodError;

        products?.forEach(product => {
            if (product.companies?.slug) {
                sitemap += `
  <url>
    <loc>${SITE_URL}/catalogo/${product.companies.slug}/producto/${product.slug}</loc>
    <lastmod>${new Date(product.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
            }
        });

        sitemap += '\n</urlset>';

        const publicDir = path.join(__dirname, 'public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir);
        }

        fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
        console.log('✅ sitemap.xml generado con éxito en /public');

    } catch (error) {
        console.error('❌ Error generando sitemap:', error);
    }
}

generateSitemap();
