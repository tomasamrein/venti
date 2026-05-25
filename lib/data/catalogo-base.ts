/**
 * Catálogo base curado de productos comunes en comercios argentinos.
 * Sin código de barras a propósito: se evita embeber EANs sin verificar.
 * El producto se vende igual tocándolo en la grilla del POS, y luego se le
 * puede escanear/linkear un código real. Las categorías coinciden con las de
 * `lib/utils/business-presets.ts` para reusar el árbol default del onboarding.
 */

export interface CatalogItem {
  name: string
  brand: string | null
  category: string
  unit: string
}

export const CATALOGO_BASE: CatalogItem[] = [
  // ── Bebidas ──────────────────────────────────────────────
  { name: 'Coca-Cola 500ml', brand: 'Coca-Cola', category: 'Bebidas', unit: 'un' },
  { name: 'Coca-Cola 1.5L', brand: 'Coca-Cola', category: 'Bebidas', unit: 'un' },
  { name: 'Coca-Cola 2.25L', brand: 'Coca-Cola', category: 'Bebidas', unit: 'un' },
  { name: 'Coca-Cola Zero 500ml', brand: 'Coca-Cola', category: 'Bebidas', unit: 'un' },
  { name: 'Sprite 500ml', brand: 'Sprite', category: 'Bebidas', unit: 'un' },
  { name: 'Sprite 1.5L', brand: 'Sprite', category: 'Bebidas', unit: 'un' },
  { name: 'Fanta 500ml', brand: 'Fanta', category: 'Bebidas', unit: 'un' },
  { name: 'Fanta 1.5L', brand: 'Fanta', category: 'Bebidas', unit: 'un' },
  { name: 'Pepsi 500ml', brand: 'Pepsi', category: 'Bebidas', unit: 'un' },
  { name: 'Pepsi 2.25L', brand: 'Pepsi', category: 'Bebidas', unit: 'un' },
  { name: 'Manaos Cola 2.25L', brand: 'Manaos', category: 'Bebidas', unit: 'un' },
  { name: 'Paso de los Toros 1.5L', brand: 'Paso de los Toros', category: 'Bebidas', unit: 'un' },
  { name: 'Seven Up 1.5L', brand: '7Up', category: 'Bebidas', unit: 'un' },
  { name: 'Agua Villavicencio 500ml', brand: 'Villavicencio', category: 'Bebidas', unit: 'un' },
  { name: 'Agua Villa del Sur 500ml', brand: 'Villa del Sur', category: 'Bebidas', unit: 'un' },
  { name: 'Agua Villa del Sur 2L', brand: 'Villa del Sur', category: 'Bebidas', unit: 'un' },
  { name: 'Agua saborizada Levité Pomelo 1.5L', brand: 'Levité', category: 'Bebidas', unit: 'un' },
  { name: 'Agua saborizada Ser Manzana 1.5L', brand: 'Ser', category: 'Bebidas', unit: 'un' },
  { name: 'Cepita Naranja 1L', brand: 'Cepita', category: 'Bebidas', unit: 'un' },
  { name: 'Cepita Multifruta 200ml', brand: 'Cepita', category: 'Bebidas', unit: 'un' },
  { name: 'Baggio Manzana 1L', brand: 'Baggio', category: 'Bebidas', unit: 'un' },
  { name: 'Powerade Mountain Blast 500ml', brand: 'Powerade', category: 'Bebidas', unit: 'un' },
  { name: 'Gatorade Naranja 500ml', brand: 'Gatorade', category: 'Bebidas', unit: 'un' },
  { name: 'Speed XL 250ml', brand: 'Speed', category: 'Bebidas', unit: 'un' },
  { name: 'Red Bull 250ml', brand: 'Red Bull', category: 'Bebidas', unit: 'un' },
  { name: 'Monster Energy 473ml', brand: 'Monster', category: 'Bebidas', unit: 'un' },
  { name: 'Cerveza Quilmes 1L', brand: 'Quilmes', category: 'Bebidas', unit: 'un' },
  { name: 'Cerveza Quilmes Lata 473ml', brand: 'Quilmes', category: 'Bebidas', unit: 'un' },
  { name: 'Cerveza Brahma 1L', brand: 'Brahma', category: 'Bebidas', unit: 'un' },
  { name: 'Cerveza Andes Origen 473ml', brand: 'Andes', category: 'Bebidas', unit: 'un' },
  { name: 'Cerveza Stella Artois 975ml', brand: 'Stella Artois', category: 'Bebidas', unit: 'un' },
  { name: 'Fernet Branca 750ml', brand: 'Branca', category: 'Bebidas', unit: 'un' },
  { name: 'Vino Toro Tinto 1L', brand: 'Toro', category: 'Bebidas', unit: 'un' },

  // ── Golosinas ────────────────────────────────────────────
  { name: 'Alfajor Jorgito Chocolate', brand: 'Jorgito', category: 'Golosinas', unit: 'un' },
  { name: 'Alfajor Guaymallén Simple', brand: 'Guaymallén', category: 'Golosinas', unit: 'un' },
  { name: 'Alfajor Milka Oreo', brand: 'Milka', category: 'Golosinas', unit: 'un' },
  { name: 'Alfajor Águila Triple', brand: 'Águila', category: 'Golosinas', unit: 'un' },
  { name: 'Alfajor Terrabusi Triple', brand: 'Terrabusi', category: 'Golosinas', unit: 'un' },
  { name: 'Bon o Bon', brand: 'Arcor', category: 'Golosinas', unit: 'un' },
  { name: 'Bon o Bon Caja x16', brand: 'Arcor', category: 'Golosinas', unit: 'un' },
  { name: 'Chocolate Milka Leche 100g', brand: 'Milka', category: 'Golosinas', unit: 'un' },
  { name: 'Chocolate Cofler Aireado 100g', brand: 'Cofler', category: 'Golosinas', unit: 'un' },
  { name: 'Chocolate Block 100g', brand: 'Águila', category: 'Golosinas', unit: 'un' },
  { name: 'Rhodesia', brand: 'Terrabusi', category: 'Golosinas', unit: 'un' },
  { name: 'Tita', brand: 'Terrabusi', category: 'Golosinas', unit: 'un' },
  { name: 'Rumba', brand: 'Terrabusi', category: 'Golosinas', unit: 'un' },
  { name: 'Tofi', brand: 'Arcor', category: 'Golosinas', unit: 'un' },
  { name: 'Mantecol 130g', brand: 'Mantecol', category: 'Golosinas', unit: 'un' },
  { name: 'Caramelos Sugus', brand: 'Sugus', category: 'Golosinas', unit: 'un' },
  { name: 'Caramelos Media Hora', brand: 'Arcor', category: 'Golosinas', unit: 'un' },
  { name: 'Menthoplus Miel', brand: 'Menthoplus', category: 'Golosinas', unit: 'un' },
  { name: 'Halls Mentol', brand: 'Halls', category: 'Golosinas', unit: 'un' },
  { name: 'Chicle Beldent Menta', brand: 'Beldent', category: 'Golosinas', unit: 'un' },
  { name: 'Chupetín Pico Dulce', brand: 'Arcor', category: 'Golosinas', unit: 'un' },
  { name: 'Gomitas Mogul Fizz', brand: 'Mogul', category: 'Golosinas', unit: 'un' },
  { name: 'Flynn Paff', brand: 'Billiken', category: 'Golosinas', unit: 'un' },
  { name: 'Chocolatín Jack', brand: 'Arcor', category: 'Golosinas', unit: 'un' },
  { name: 'Kinder Sorpresa', brand: 'Kinder', category: 'Golosinas', unit: 'un' },
  { name: 'Rocklets', brand: 'Arcor', category: 'Golosinas', unit: 'un' },

  // ── Galletitas ───────────────────────────────────────────
  { name: 'Oreo Original 118g', brand: 'Oreo', category: 'Galletitas', unit: 'un' },
  { name: 'Pepitos 118g', brand: 'Pepitos', category: 'Galletitas', unit: 'un' },
  { name: 'Chocolinas 170g', brand: 'Chocolinas', category: 'Galletitas', unit: 'un' },
  { name: 'Criollitas 200g', brand: 'Criollitas', category: 'Galletitas', unit: 'un' },
  { name: 'Express Clásicas 200g', brand: 'Express', category: 'Galletitas', unit: 'un' },
  { name: 'Sonrisas 118g', brand: 'Terrabusi', category: 'Galletitas', unit: 'un' },
  { name: 'Manon 118g', brand: 'Terrabusi', category: 'Galletitas', unit: 'un' },
  { name: 'Rumba Galletita', brand: 'Terrabusi', category: 'Galletitas', unit: 'un' },
  { name: 'Surtido Bagley 400g', brand: 'Bagley', category: 'Galletitas', unit: 'un' },
  { name: 'Traviata 100g', brand: 'Traviata', category: 'Galletitas', unit: 'un' },
  { name: 'Mellizas 100g', brand: 'Bagley', category: 'Galletitas', unit: 'un' },
  { name: 'Saladix Jamón 100g', brand: 'Saladix', category: 'Galletitas', unit: 'un' },
  { name: 'Cerealitas 200g', brand: 'Cerealitas', category: 'Galletitas', unit: 'un' },
  { name: 'Don Satur Saladas', brand: 'Don Satur', category: 'Galletitas', unit: 'un' },
  { name: 'Tostadas Express', brand: 'Express', category: 'Galletitas', unit: 'un' },

  // ── Snacks ───────────────────────────────────────────────
  { name: 'Papas Lays Clásicas 145g', brand: 'Lays', category: 'Snacks', unit: 'un' },
  { name: 'Papas Pringles Original', brand: 'Pringles', category: 'Snacks', unit: 'un' },
  { name: 'Doritos Queso 77g', brand: 'Doritos', category: 'Snacks', unit: 'un' },
  { name: '3D Jamón', brand: '3D', category: 'Snacks', unit: 'un' },
  { name: 'Cheetos Pelotitas', brand: 'Cheetos', category: 'Snacks', unit: 'un' },
  { name: 'Palitos Pehuamar', brand: 'Pehuamar', category: 'Snacks', unit: 'un' },
  { name: 'Maní con Cáscara', brand: null, category: 'Snacks', unit: 'un' },
  { name: 'Maní Japonés Pehuamar', brand: 'Pehuamar', category: 'Snacks', unit: 'un' },
  { name: 'Papas Krachitos Jamón', brand: 'Krachitos', category: 'Snacks', unit: 'un' },
  { name: 'Conitos Pehuamar', brand: 'Pehuamar', category: 'Snacks', unit: 'un' },

  // ── Cigarrillos ──────────────────────────────────────────
  { name: 'Marlboro Box 20', brand: 'Marlboro', category: 'Cigarrillos', unit: 'un' },
  { name: 'Marlboro Gold 20', brand: 'Marlboro', category: 'Cigarrillos', unit: 'un' },
  { name: 'Philip Morris Box 20', brand: 'Philip Morris', category: 'Cigarrillos', unit: 'un' },
  { name: 'Camel Box 20', brand: 'Camel', category: 'Cigarrillos', unit: 'un' },
  { name: 'Lucky Strike 20', brand: 'Lucky Strike', category: 'Cigarrillos', unit: 'un' },
  { name: 'Chesterfield 20', brand: 'Chesterfield', category: 'Cigarrillos', unit: 'un' },
  { name: 'Parliament 20', brand: 'Parliament', category: 'Cigarrillos', unit: 'un' },
  { name: 'Rothmans 20', brand: 'Rothmans', category: 'Cigarrillos', unit: 'un' },
  { name: 'Encendedor Bic', brand: 'Bic', category: 'Cigarrillos', unit: 'un' },
  { name: 'Papel de Armar OCB', brand: 'OCB', category: 'Cigarrillos', unit: 'un' },

  // ── Lácteos ──────────────────────────────────────────────
  { name: 'Leche La Serenísima Entera 1L', brand: 'La Serenísima', category: 'Lácteos', unit: 'un' },
  { name: 'Leche La Serenísima Descremada 1L', brand: 'La Serenísima', category: 'Lácteos', unit: 'un' },
  { name: 'Leche Sancor Entera 1L', brand: 'Sancor', category: 'Lácteos', unit: 'un' },
  { name: 'Yogur Yogurísimo Frutilla 190g', brand: 'Yogurísimo', category: 'Lácteos', unit: 'un' },
  { name: 'Yogur Ser Bebible 1L', brand: 'Ser', category: 'Lácteos', unit: 'un' },
  { name: 'Queso Crema Casancrem 290g', brand: 'Casancrem', category: 'Lácteos', unit: 'un' },
  { name: 'Manteca La Serenísima 200g', brand: 'La Serenísima', category: 'Lácteos', unit: 'un' },
  { name: 'Dulce de Leche La Serenísima 400g', brand: 'La Serenísima', category: 'Lácteos', unit: 'un' },
  { name: 'Queso Cremoso x kg', brand: null, category: 'Lácteos', unit: 'kg' },
  { name: 'Huevos Maple x6', brand: null, category: 'Lácteos', unit: 'un' },

  // ── Helados ──────────────────────────────────────────────
  { name: 'Palito Bombón Escocés', brand: 'Frigor', category: 'Helados', unit: 'un' },
  { name: 'Cucurucho Frigor', brand: 'Frigor', category: 'Helados', unit: 'un' },
  { name: 'Helado Pote 1kg', brand: null, category: 'Helados', unit: 'un' },
  { name: 'Magnum Clásico', brand: 'Magnum', category: 'Helados', unit: 'un' },
  { name: 'Bombón Helado Laponia', brand: 'Laponia', category: 'Helados', unit: 'un' },

  // ── Almacén ──────────────────────────────────────────────
  { name: 'Azúcar Ledesma 1kg', brand: 'Ledesma', category: 'Almacén', unit: 'un' },
  { name: 'Yerba Mate Playadito 1kg', brand: 'Playadito', category: 'Almacén', unit: 'un' },
  { name: 'Yerba Mate La Tranquera 1kg', brand: 'La Tranquera', category: 'Almacén', unit: 'un' },
  { name: 'Yerba Mate Rosamonte 1kg', brand: 'Rosamonte', category: 'Almacén', unit: 'un' },
  { name: 'Café La Virginia 250g', brand: 'La Virginia', category: 'Almacén', unit: 'un' },
  { name: 'Café Instantáneo Nescafé 100g', brand: 'Nescafé', category: 'Almacén', unit: 'un' },
  { name: 'Aceite Natura 900ml', brand: 'Natura', category: 'Almacén', unit: 'un' },
  { name: 'Aceite Cocinero 1.5L', brand: 'Cocinero', category: 'Almacén', unit: 'un' },
  { name: 'Fideos Matarazzo 500g', brand: 'Matarazzo', category: 'Almacén', unit: 'un' },
  { name: 'Fideos Lucchetti Tirabuzón 500g', brand: 'Lucchetti', category: 'Almacén', unit: 'un' },
  { name: 'Arroz Gallo Oro 1kg', brand: 'Gallo', category: 'Almacén', unit: 'un' },
  { name: 'Harina 0000 Blancaflor 1kg', brand: 'Blancaflor', category: 'Almacén', unit: 'un' },
  { name: 'Polenta Mágica 500g', brand: 'Presto Pronta', category: 'Almacén', unit: 'un' },
  { name: 'Puré de Tomate Arcor 520g', brand: 'Arcor', category: 'Almacén', unit: 'un' },
  { name: 'Arvejas La Campagnola 350g', brand: 'La Campagnola', category: 'Almacén', unit: 'un' },
  { name: 'Atún La Campagnola 170g', brand: 'La Campagnola', category: 'Almacén', unit: 'un' },
  { name: 'Mayonesa Hellmanns 250g', brand: "Hellmann's", category: 'Almacén', unit: 'un' },
  { name: 'Ketchup Hellmanns 250g', brand: "Hellmann's", category: 'Almacén', unit: 'un' },
  { name: 'Sal Fina Celusal 500g', brand: 'Celusal', category: 'Almacén', unit: 'un' },
  { name: 'Mermelada Arcor Durazno 390g', brand: 'Arcor', category: 'Almacén', unit: 'un' },

  // ── Panadería ────────────────────────────────────────────
  { name: 'Pan Lactal Bimbo', brand: 'Bimbo', category: 'Panadería', unit: 'un' },
  { name: 'Pan de Mesa x kg', brand: null, category: 'Panadería', unit: 'kg' },
  { name: 'Facturas x docena', brand: null, category: 'Panadería', unit: 'un' },
  { name: 'Medialunas x unidad', brand: null, category: 'Panadería', unit: 'un' },
  { name: 'Pan Rallado Preferido 500g', brand: 'Preferido', category: 'Panadería', unit: 'un' },

  // ── Fiambres ─────────────────────────────────────────────
  { name: 'Jamón Cocido x kg', brand: null, category: 'Fiambres', unit: 'kg' },
  { name: 'Queso de Máquina x kg', brand: null, category: 'Fiambres', unit: 'kg' },
  { name: 'Salame x kg', brand: null, category: 'Fiambres', unit: 'kg' },
  { name: 'Mortadela x kg', brand: null, category: 'Fiambres', unit: 'kg' },

  // ── Limpieza ─────────────────────────────────────────────
  { name: 'Lavandina Ayudín 1L', brand: 'Ayudín', category: 'Limpieza', unit: 'un' },
  { name: 'Detergente Magistral 750ml', brand: 'Magistral', category: 'Limpieza', unit: 'un' },
  { name: 'Jabón en Polvo Skip 800g', brand: 'Skip', category: 'Limpieza', unit: 'un' },
  { name: 'Papel Higiénico Higienol x4', brand: 'Higienol', category: 'Limpieza', unit: 'un' },
  { name: 'Rollo de Cocina Sussex x3', brand: 'Sussex', category: 'Limpieza', unit: 'un' },
  { name: 'Esponja Mortimer', brand: 'Mortimer', category: 'Limpieza', unit: 'un' },
  { name: 'Limpiador Cif Crema 750ml', brand: 'Cif', category: 'Limpieza', unit: 'un' },
  { name: 'Servilletas Elite x100', brand: 'Elite', category: 'Limpieza', unit: 'un' },

  // ── Cuidado personal ─────────────────────────────────────
  { name: 'Shampoo Sedal 340ml', brand: 'Sedal', category: 'Cuidado personal', unit: 'un' },
  { name: 'Jabón Dove 90g', brand: 'Dove', category: 'Cuidado personal', unit: 'un' },
  { name: 'Pasta Dental Colgate 90g', brand: 'Colgate', category: 'Cuidado personal', unit: 'un' },
  { name: 'Desodorante Rexona 150ml', brand: 'Rexona', category: 'Cuidado personal', unit: 'un' },
  { name: 'Maquinita Gillette x2', brand: 'Gillette', category: 'Cuidado personal', unit: 'un' },
  { name: 'Toallitas Femeninas Always x8', brand: 'Always', category: 'Cuidado personal', unit: 'un' },
  { name: 'Pañales Pampers M x10', brand: 'Pampers', category: 'Cuidado personal', unit: 'un' },
  { name: 'Alcohol en Gel 250ml', brand: null, category: 'Cuidado personal', unit: 'un' },

  // ── Librería / Útiles ────────────────────────────────────
  { name: 'Birome Bic Azul', brand: 'Bic', category: 'Librería', unit: 'un' },
  { name: 'Birome Bic Negra', brand: 'Bic', category: 'Librería', unit: 'un' },
  { name: 'Lápiz Negro Faber-Castell', brand: 'Faber-Castell', category: 'Librería', unit: 'un' },
  { name: 'Goma de Borrar Maped', brand: 'Maped', category: 'Librería', unit: 'un' },
  { name: 'Cuaderno Rivadavia 48 hojas', brand: 'Rivadavia', category: 'Librería', unit: 'un' },
  { name: 'Resma A4 75g', brand: null, category: 'Librería', unit: 'un' },
  { name: 'Marcador Resaltador', brand: null, category: 'Librería', unit: 'un' },
  { name: 'Pegamento Voligoma', brand: 'Voligoma', category: 'Librería', unit: 'un' },
  { name: 'Tijera Escolar', brand: null, category: 'Librería', unit: 'un' },
  { name: 'Corrector Líquido', brand: null, category: 'Librería', unit: 'un' },
]

/** Categorías presentes en el catálogo, en orden de aparición. */
export const CATALOGO_CATEGORIES: string[] = [...new Set(CATALOGO_BASE.map(i => i.category))]
