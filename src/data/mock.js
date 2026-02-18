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
        plan: 'pro',
        subscriptionDate: '2024-01-01',
        renewalDate: '2025-01-01',
        socials: {
            instagram: 'https://instagram.com/ecoverde',
            tiktok: 'https://tiktok.com/@ecoverde',
            website: 'https://ecoverde.cl'
        },
        features: {
            cartEnabled: true
        },
        reviews: [
            { id: 1, user: 'Maria L.', rating: 5, comment: 'Excelente atención y productos muy comprometidos con el medio ambiente.', date: '2024-01-15' },
            { id: 2, user: 'Pedro J.', rating: 4, comment: 'Muy buenos productos, el envío tardó un poco más de lo esperado.', date: '2024-01-20' },
            { id: 3, user: 'Sofía M.', rating: 5, comment: 'Me encanta que todo sea ecológico. Volveré a comprar.', date: '2024-02-01' }
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
        plan: 'free',
        subscriptionDate: '2024-02-10',
        renewalDate: '2024-03-10',
        socials: {
            instagram: 'https://instagram.com/technova',
            website: 'https://technova.store'
        },
        features: {
            cartEnabled: true
        },
        reviews: [
            { id: 1, user: 'Carlos M.', rating: 5, comment: 'La mejor tecnología a precios justos.', date: '2024-02-01' },
            { id: 2, user: 'Ana R.', rating: 4, comment: 'Buenos precios, pero faltan más accesorios.', date: '2024-02-05' }
        ]
    },
    {
        id: '3',
        name: 'Restaurante Delicias',
        slug: 'restaurante-delicias',
        description: 'La mejor comida casera y gourmet de la ciudad.',
        logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=200&auto=format&fit=crop',
        banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
        whatsapp: '56986920235',
        rating: 4.9,
        plan: 'pro',
        subscriptionDate: '2024-01-15',
        renewalDate: '2024-02-15',
        socials: {
            instagram: 'https://instagram.com/restaurantedelicias',
            tiktok: 'https://tiktok.com/@restaurantedelicias',
            website: 'https://delicias.cl'
        },
        features: {
            cartEnabled: true // Enable cart so it can be toggled via "Menu Mode"
        },
        reviews: [
            { id: 1, user: 'Ana P.', rating: 5, comment: 'La comida estaba deliciosa y la atención fue excelente.', date: '2024-02-05' },
            { id: 2, user: 'Jorge L.', rating: 5, comment: 'El mejor lomo a lo pobre que he comido.', date: '2024-02-08' },
            { id: 3, user: 'Marta S.', rating: 4, comment: 'Muy rico todo, aunque el local estaba un poco lleno.', date: '2024-02-10' },
            { id: 4, user: 'Carlos D.', rating: 5, comment: 'Los postres son imperdibles, especialmente el tiramisú.', date: '2024-02-12' }
        ]
    }
];

export const CATEGORIES = [
    // EcoVerde Spa categories
    { id: 'cat1', name: 'Cuidado Personal', slug: 'cuidado-personal', companyId: '1' },
    { id: 'cat2', name: 'Hogar Sostenible', slug: 'hogar-sostenible', companyId: '1' },
    { id: 'cat3', name: 'Accesorios Eco', slug: 'accesorios-eco', companyId: '1' },
    { id: 'cat4', name: 'Belleza Natural', slug: 'belleza-natural', companyId: '1' },

    // TechNova categories
    { id: 'cat5', name: 'Tecnología', slug: 'tecnologia', companyId: '2' },
    { id: 'cat6', name: 'Accesorios Tech', slug: 'accesorios-tech', companyId: '2' },

    // Restaurant categories
    { id: 'cat7', name: 'Entradas', slug: 'entradas', companyId: '3' },
    { id: 'cat8', name: 'Platos de Fondo', slug: 'platos-fondo', companyId: '3' },
    { id: 'cat9', name: 'Bebidas', slug: 'bebidas', companyId: '3' },
    { id: 'cat10', name: 'Postres', slug: 'postres', companyId: '3' },
];

export const PRODUCTS = [
    {
        id: 'p1',
        name: 'Bolsa de Algodón Orgánico',
        slug: 'bolsa-algodon',
        sku: 'ECO-BAG-001',
        price: 5000,
        stock: 45,
        available: true,
        rating: 4.7,
        description: 'Bolsa reutilizable hecha de algodón 100% orgánico certificado.',
        weight: '100g',
        size: '40x45cm',
        categories: ['cat2', 'cat3'], // Hogar Sostenible, Accesorios Eco
        companyId: '1',
        views: 450,
        quotesCount: 12,
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
        stock: 150,
        available: true,
        rating: 4.9,
        description: 'Cepillo de dientes biodegradable con cerdas de carbón activado.',
        weight: '20g',
        size: '18cm',
        categories: ['cat1', 'cat4'], // Cuidado Personal, Belleza Natural
        companyId: '1',
        views: 890,
        quotesCount: 25,
        images: ['https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?q=80&w=800&auto=format&fit=crop'],
        reviews: [
            { id: 1, user: 'Andrés K.', rating: 5, comment: 'Cerdas muy suaves, excelente para encías sensibles.', date: '2024-02-10' },
            { id: 2, user: 'Camila T.', rating: 5, comment: 'Me encanta que sean compostables.', date: '2024-02-11' }
        ]
    },
    {
        id: 'p11',
        name: 'Jabón Artesanal de Lavanda',
        slug: 'jabon-lavanda',
        sku: 'ECO-JAB-003',
        price: 3500,
        stock: 80,
        available: true,
        rating: 4.8,
        description: 'Jabón natural hecho a mano con aceites esenciales de lavanda orgánica.',
        weight: '120g',
        size: 'Barra',
        categories: ['cat1', 'cat4'], // Cuidado Personal, Belleza Natural
        companyId: '1',
        views: 320,
        quotesCount: 15,
        images: ['https://images.unsplash.com/photo-1589060040782-234fa4ee0b61?q=80&w=800&auto=format&fit=crop'],
        reviews: [
            { id: 1, user: 'Patricia L.', rating: 5, comment: 'Huele increíble y deja la piel muy suave.', date: '2024-02-08' }
        ]
    },
    {
        id: 'p12',
        name: 'Botella Térmica Acero Inoxidable',
        slug: 'botella-termica',
        sku: 'ECO-BOT-004',
        price: 12000,
        stock: 35,
        available: true,
        rating: 4.9,
        description: 'Botella térmica de doble pared que mantiene bebidas frías por 24h y calientes por 12h.',
        weight: '350g',
        size: '500ml',
        categories: ['cat2', 'cat3'], // Hogar Sostenible, Accesorios Eco
        companyId: '1',
        views: 560,
        quotesCount: 20,
        images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop'],
        reviews: [
            { id: 1, user: 'Diego M.', rating: 5, comment: 'Excelente calidad, mantiene el café caliente todo el día.', date: '2024-02-11' },
            { id: 2, user: 'Fernanda S.', rating: 5, comment: 'Perfecta para el gimnasio.', date: '2024-02-13' }
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
        categories: ['cat5'], // Tecnología
        companyId: '2',
        views: 320,
        quotesCount: 5,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop'],
        reviews: [
            { id: 1, user: 'Felipe S.', rating: 5, comment: 'La cancelación de ruido es increíble por este precio.', date: '2024-02-12' },
            { id: 2, user: 'Ignacio R.', rating: 4, comment: 'Buen sonido, aunque un poco pesados.', date: '2024-02-13' }
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
        categories: ['cat5', 'cat6'], // Tecnología, Accesorios Tech
        companyId: '2',
        views: 156,
        quotesCount: 3,
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
        categories: ['cat7'], // Entradas
        companyId: '3',
        views: 210,
        quotesCount: 8,
        images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop'],
        reviews: [
            { id: 1, user: 'Rosa D.', rating: 5, comment: 'El sabor es exquisito, se nota que es pura.', date: '2024-02-14' },
            { id: 2, user: 'Juan Pablo M.', rating: 5, comment: 'Excelente calidad, volveré a comprar.', date: '2024-02-15' }
        ]
    },
    {
        id: 'p6',
        name: 'Empanadas de Pino',
        slug: 'empanadas-pino',
        sku: 'RES-EMP-001',
        price: 2500,
        stock: 50,
        rating: 4.8,
        description: 'Empanadas de horno tradicionales con carne picada, aceituna, huevo y pasas.',
        weight: '2 unidades',
        size: 'Entrada',
        categories: ['cat7'], // Entradas
        companyId: '3',
        views: 300,
        quotesCount: 20,
        images: ['https://images.pexels.com/photos/6941010/pexels-photo-6941010.jpeg?auto=compress&cs=tinysrgb&w=800'],
        reviews: [
            { id: 1, user: 'Carlos V.', rating: 5, comment: 'Muy jugosas y la masa perfecta.', date: '2024-02-10' },
            { id: 2, user: 'Andrea L.', rating: 4, comment: 'Ricas, pero llegaron un poco tibias.', date: '2024-02-11' }
        ]
    },
    {
        id: 'p7',
        name: 'Lomo a lo Pobre',
        slug: 'lomo-pobre',
        sku: 'RES-LOM-002',
        price: 12990,
        stock: 20,
        rating: 4.9,
        description: 'Jugoso lomo vetado acompañado de papas fritas, cebolla caramelizada y huevos fritos.',
        weight: '1 persona',
        size: 'Plato principal',
        categories: ['cat8'], // Platos de Fondo
        companyId: '3',
        views: 500,
        quotesCount: 45,
        images: ['https://images.pexels.com/photos/3535383/pexels-photo-3535383.jpeg?auto=compress&cs=tinysrgb&w=800'],
        reviews: [
            { id: 1, user: 'Jorge L.', rating: 5, comment: 'El punto de la carne estaba perfecto.', date: '2024-02-08' },
            { id: 2, user: 'Marta S.', rating: 5, comment: 'Plato muy contundente y sabroso.', date: '2024-02-10' },
            { id: 3, user: 'Pedro A.', rating: 5, comment: 'Las papas fritas caseras son lo mejor.', date: '2024-02-12' }
        ]
    },
    {
        id: 'p8',
        name: 'Reineta a la Plancha',
        slug: 'reineta-plancha',
        sku: 'RES-REI-003',
        price: 9990,
        stock: 0,
        rating: 4.7,
        description: 'Filete de reineta fresca a la plancha con agregado de arroz o ensalada surtida.',
        weight: '1 persona',
        size: 'Plato principal',
        categories: ['cat8'], // Platos de Fondo
        companyId: '3',
        views: 280,
        quotesCount: 15,
        images: ['https://images.pexels.com/photos/3763847/pexels-photo-3763847.jpeg?auto=compress&cs=tinysrgb&w=800'],
        reviews: [
            { id: 1, user: 'Lucía F.', rating: 5, comment: 'Muy fresco el pescado, excelente preparación.', date: '2024-01-28' },
            { id: 2, user: 'Roberto G.', rating: 4, comment: 'Rico, pero la porción de arroz podría ser mayor.', date: '2024-02-01' }
        ]
    },
    {
        id: 'p9',
        name: 'Jugo Natural de Frambuesa',
        slug: 'jugo-frambuesa',
        sku: 'RES-BEB-004',
        price: 3500,
        stock: 100,
        rating: 5.0,
        description: 'Jugo 100% natural de frambuesas recién cosechadas.',
        weight: '500 ml',
        size: 'Bebida fría',
        categories: ['cat9'], // Bebidas
        companyId: '3',
        views: 150,
        quotesCount: 30,
        images: ['https://images.pexels.com/photos/1132558/pexels-photo-1132558.jpeg?auto=compress&cs=tinysrgb&w=800'],
        reviews: [
            { id: 1, user: 'Fernanda C.', rating: 5, comment: 'Muy refrescante y natural.', date: '2024-02-13' }
        ]
    },
    {
        id: 'p10',
        name: 'Tiramisú Casero',
        slug: 'tiramisu-casero',
        sku: 'RES-POS-005',
        price: 4500,
        stock: 25,
        rating: 4.9,
        description: 'Clásico postre italiano preparado con mascarpone fresco y café de grano.',
        weight: '1 porción',
        size: 'Postre',
        categories: ['cat10'], // Postres
        companyId: '3',
        views: 400,
        quotesCount: 50,
        images: ['https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=800'],
        reviews: [
            { id: 1, user: 'Carlos D.', rating: 5, comment: 'El mejor tiramisú que he probado.', date: '2024-02-12' },
            { id: 2, user: 'Patricia M.', rating: 5, comment: 'Perfecto equilibrio de dulzor y café.', date: '2024-02-14' }
        ]
    }
];

export const QUOTES = [
    {
        id: 'q1',
        companyId: '1',
        customer_name: 'Helton Smith',
        customer_whatsapp: '+56986920235',
        quote_items: [
            { id: 1, quantity: 5, price_at_time: 2500, products: { name: 'Cepillo de Bambú' } }
        ],
        total: 12500,
        status: 'completed',
        created_at: '2024-02-09T10:30:00',
        notes: 'Cliente preguntó por envío express'
    },
    {
        id: 'q2',
        companyId: '1',
        customer_name: 'María González',
        customer_whatsapp: '+56987654321',
        quote_items: [
            { id: 1, quantity: 3, price_at_time: 3500, products: { name: 'Jabón Artesanal de Lavanda' } },
            { id: 2, quantity: 2, price_at_time: 5000, products: { name: 'Bolsa de Algodón Orgánico' } }
        ],
        total: 20500,
        status: 'pending',
        created_at: '2024-02-13T16:45:00',
        notes: 'Solicita factura electrónica'
    },
    {
        id: 'q3',
        companyId: '1',
        customer_name: 'Carlos Ramírez',
        customer_whatsapp: '+56912345678',
        quote_items: [
            { id: 1, quantity: 2, price_at_time: 12000, products: { name: 'Botella Térmica Acero Inoxidable' } },
            { id: 2, quantity: 10, price_at_time: 2500, products: { name: 'Cepillo de Bambú' } }
        ],
        total: 49000,
        status: 'pending',
        created_at: '2024-02-14T09:15:00',
        notes: 'Compra para regalo corporativo'
    },
    {
        id: 'q4',
        companyId: '1',
        customer_name: 'Ana Martínez',
        customer_whatsapp: '+56998765432',
        quote_items: [
            { id: 1, quantity: 5, price_at_time: 5000, products: { name: 'Bolsa de Algodón Orgánico' } }
        ],
        total: 25000,
        status: 'cancelled',
        created_at: '2024-02-10T14:20:00',
        notes: 'Cliente canceló por cambio de planes'
    }
];

export const CHATS = {
    1: [
        { id: 1, text: "Hola! Vi sus productos ecológicos en el catálogo 🌱", sender: 'user', time: '10:25 AM' },
        { id: 2, text: "¿Tienen stock del Cepillo de Bambú? Me interesa comprar 5 unidades.", sender: 'user', time: '10:26 AM' },
        { id: 3, text: "¡Hola! Sí, tenemos stock disponible. Te envío la cotización 😊", sender: 'store', time: '10:28 AM' }
    ],
    2: [
        { id: 1, text: "Buenos días, ¿hacen entregas mañana en Las Condes?", sender: 'user', time: 'Ayer' },
        { id: 2, text: "¡Hola! Sí, hacemos entregas todos los días. ¿Qué productos te interesan?", sender: 'store', time: 'Ayer' },
        { id: 3, text: "Perfecto! Quiero 3 jabones de lavanda y 2 bolsas de algodón. Muchas gracias 🙏", sender: 'user', time: 'Ayer' }
    ],
    3: [
        { id: 1, text: "Hola, ¿hacen envíos a regiones? Estoy en Valparaíso.", sender: 'user', time: 'Lun' },
        { id: 2, text: "¡Sí! Enviamos a todo Chile. El costo de envío se calcula según el peso.", sender: 'store', time: 'Lun' },
        { id: 3, text: "Genial, me gustaría cotizar 2 botellas térmicas entonces.", sender: 'user', time: 'Lun' }
    ]
};

export const CONVERSATIONS = [
    {
        id: 1,
        companyId: '1',
        user: "Helton Smith",
        lastMessage: "¿Tienen stock del Cepillo de Bambú?",
        time: "10:30 AM",
        unread: true,
        status: "online",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100"
    },
    {
        id: 2,
        companyId: '1',
        user: "María González",
        lastMessage: "Perfecto! Quiero 3 jabones de lavanda...",
        time: "Ayer",
        unread: false,
        status: "offline",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
    },
    {
        id: 3,
        companyId: '1',
        user: "Carlos Ramírez",
        lastMessage: "Genial, me gustaría cotizar 2 botellas...",
        time: "Lun",
        unread: false,
        status: "offline",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
    },
    {
        id: 4,
        companyId: '3',
        user: "Ana Pérez",
        lastMessage: "¿Tienen disponible el lomo a lo pobre?",
        time: "Hoy",
        unread: true,
        status: "online",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
    },
    {
        id: 5,
        companyId: '3',
        user: "Jorge López",
        lastMessage: "Gracias, la comida estuvo deliciosa!",
        time: "Ayer",
        unread: false,
        status: "offline",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"
    }
];
