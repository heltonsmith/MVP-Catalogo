export const COMPANIES = [
    {
        id: '1',
        name: 'EcoVerde Spa',
        slug: 'ecoverde-spa',
        description: 'Productos sostenibles para un futuro más verde.',
        logo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=200&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop',
        whatsapp: '56986920235',
        rating: 4.8,
        reviews: [
            { id: 1, user: 'Maria L.', rating: 5, comment: 'Excelente atención y productos muy comprometidos con el medio ambiente.', date: '2024-01-15' },
            { id: 2, user: 'Pedro J.', rating: 4, comment: 'Muy buenos productos, el envío tardó un poco más de lo esperado.', date: '2024-01-20' }
        ]
    },
    {
        id: '2',
        name: 'TechNova Store',
        slug: 'technova-store',
        description: 'Lo último en tecnología y gadgets innovadores.',
        logo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=200&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop',
        whatsapp: '56986920235',
        rating: 4.5,
        reviews: [
            { id: 1, user: 'Carlos M.', rating: 5, comment: 'La mejor tecnología a precios justos.', date: '2024-02-01' }
        ]
    },
    {
        id: '3',
        name: 'Artesanía Sur',
        slug: 'artesania-sur',
        description: 'Artesanía tradicional hecha a mano con amor.',
        logo: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=200&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop',
        whatsapp: '56986920235',
        rating: 4.9,
        reviews: [
            { id: 1, user: 'Ana P.', rating: 5, comment: 'Los detalles son impresionantes, muy feliz con mi compra.', date: '2024-02-05' }
        ]
    }
];

export const CATEGORIES = [
    { id: 'cat1', name: 'Ropa', slug: 'ropa' },
    { id: 'cat2', name: 'Tecnología', slug: 'tecnologia' },
    { id: 'cat3', name: 'Alimentos', slug: 'alimentos' },
    { id: 'cat4', name: 'Accesorios', slug: 'accesorios' },
];

export const PRODUCTS = [
    {
        id: 'p1',
        name: 'Bolsa de Algodón Orgánico',
        slug: 'bolsa-algodon',
        sku: 'ECO-BAG-001',
        price: 5000,
        stock: 50,
        rating: 4.7,
        description: 'Bolsa reutilizable hecha de algodón 100% orgánico certificado.',
        weight: '100g',
        size: '40x45cm',
        categoryId: 'cat4',
        companyId: '1',
        images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop'],
        reviews: [
            { id: 1, user: 'Lorena H.', rating: 5, comment: 'Muy resistente y el diseño es hermoso.', date: '2024-01-20' },
            { id: 2, user: 'Bastián G.', rating: 4, comment: 'Buena calidad, aunque un poco pequeña para lo que necesitaba.', date: '2024-01-25' }
        ]
    },
    {
        id: 'p2',
        name: 'Cepillo de Bambú',
        slug: 'cepillo-bambu',
        sku: 'ECO-BAM-002',
        price: 2500,
        stock: 200,
        rating: 4.9,
        description: 'Cepillo de dientes biodegradable con cerdas de carbón activado.',
        weight: '20g',
        size: '18cm',
        categoryId: 'cat4',
        companyId: '1',
        images: ['https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?q=80&w=800&auto=format&fit=crop'],
        reviews: [
            { id: 1, user: 'Andrés K.', rating: 5, comment: 'Cerdas muy suaves, excelente para encías sensibles.', date: '2024-02-10' }
        ]
    },
    {
        id: 'p3',
        name: 'Auriculares Noise Cancelling',
        slug: 'auriculares-nc',
        sku: 'TECH-AUD-001',
        price: 120000,
        stock: 15,
        rating: 4.6,
        description: 'Auriculares inalámbricos con cancelación de ruido activa y 30h de batería.',
        weight: '250g',
        size: 'Estándar',
        categoryId: 'cat2',
        companyId: '2',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop'],
        reviews: [
            { id: 1, user: 'Felipe S.', rating: 5, comment: 'La cancelación de ruido es increíble por este precio.', date: '2024-02-12' }
        ]
    },
    {
        id: 'p4',
        name: 'Smartwatch V2',
        slug: 'smartwatch-v2',
        sku: 'TECH-SMW-002',
        price: 85000,
        stock: 30,
        rating: 4.4,
        description: 'Reloj inteligente con GPS, sensor de ritmo cardíaco y pantalla AMOLED.',
        weight: '45g',
        size: '44mm',
        categoryId: 'cat2',
        companyId: '2',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'],
        reviews: [
            { id: 1, user: 'Valentina R.', rating: 4, comment: 'Funciona bien, la batería dura unos 5 días.', date: '2024-01-30' }
        ]
    },
    {
        id: 'p5',
        name: 'Miel de Abeja Pura',
        slug: 'miel-pura',
        sku: 'ART-MEL-001',
        price: 8000,
        stock: 100,
        rating: 5.0,
        description: 'Miel recolectada artesanalmente en los bosques del sur de Chile.',
        weight: '500g',
        size: 'Frasco vidrio',
        categoryId: 'cat3',
        companyId: '3',
        images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop'],
        reviews: [
            { id: 1, user: 'Rosa D.', rating: 5, comment: 'El sabor es exquisito, se nota que es pura.', date: '2024-02-14' }
        ]
    }
];
