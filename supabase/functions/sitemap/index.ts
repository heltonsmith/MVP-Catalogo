import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = 'https://www.ktaloog.com'

Deno.serve(async (_req) => {
    try {
        // Use service_role key to bypass RLS - this is safe because sitemap is public info
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // 1. Static Routes
        const staticRoutes = [
            '', '/explorar', '/registro', '/login',
            '/precios', '/nosotros', '/ayuda',
            '/terminos', '/privacidad'
        ]

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

        for (const route of staticRoutes) {
            sitemap += `
  <url>
    <loc>${SITE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`
        }

        // 2. Dynamic Store Routes
        const { data: companies, error: compError } = await supabase
            .from('companies')
            .select('slug, created_at')

        if (compError) {
            sitemap += `\n<!-- ERROR companies: ${compError.message} -->`
        }

        if (companies && companies.length > 0) {
            for (const company of companies) {
                const lastmod = company.created_at
                    ? new Date(company.created_at).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0]
                sitemap += `
  <url>
    <loc>${SITE_URL}/catalogo/${company.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`
            }
        } else {
            sitemap += `\n<!-- No companies found (count: ${companies?.length ?? 'null'}) -->`
        }

        // 3. Dynamic Product Routes (Only Active)
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('slug, created_at, company_id')
            .eq('active', true)

        if (prodError) {
            sitemap += `\n<!-- ERROR products: ${prodError.message} -->`
        }

        if (products && products.length > 0) {
            // Build a map of company_id -> slug for efficiency
            const companyMap: Record<string, string> = {}
            if (companies) {
                // We need company id too - re-fetch with id
                const { data: companiesWithId } = await supabase
                    .from('companies')
                    .select('id, slug')
                if (companiesWithId) {
                    for (const c of companiesWithId) {
                        companyMap[c.id] = c.slug
                    }
                }
            }

            for (const product of products) {
                const companySlug = companyMap[product.company_id]
                if (companySlug) {
                    const lastmod = product.created_at
                        ? new Date(product.created_at).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0]
                    sitemap += `
  <url>
    <loc>${SITE_URL}/catalogo/${companySlug}/producto/${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
                }
            }
        } else {
            sitemap += `\n<!-- No active products found (count: ${products?.length ?? 'null'}) -->`
        }

        sitemap += '\n</urlset>'

        return new Response(sitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'no-store'
            }
        })

    } catch (error) {
        return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><error>${error.message}</error>`,
            { status: 200, headers: { 'Content-Type': 'application/xml' } }
        )
    }
})
