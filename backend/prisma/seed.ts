import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@productora.com' },
    update: {},
    create: {
      email: 'admin@productora.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  console.log('✅ Usuario admin creado:', admin.email);

  // Crear categorías
  const categories = [
    { name: 'Cámaras', description: 'Cámaras de video y fotografía', icon: '📹', color: '#3B82F6' },
    { name: 'Audio', description: 'Micrófonos, grabadoras, interfaces', icon: '🎤', color: '#10B981' },
    { name: 'Iluminación', description: 'Luces, reflectores, accesorios', icon: '💡', color: '#F59E0B' },
    { name: 'Cables', description: 'Cables de audio, video, electricidad', icon: '🔌', color: '#8B5CF6' },
    { name: 'Trípodes y Soportes', description: 'Trípodes, monopies, rigs', icon: '📐', color: '#EC4899' },
    { name: 'Almacenamiento', description: 'Tarjetas SD, discos duros', icon: '💾', color: '#6366F1' },
    { name: 'Accesorios', description: 'Baterías, cargadores, otros', icon: '🔧', color: '#14B8A6' },
  ];

  const createdCategories: any[] = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
    console.log(`✅ Categoría creada: ${category.name}`);
  }

  // Crear ubicaciones
  const locations = [
    { name: 'Estudio Principal', description: 'Estudio principal de grabación', icon: '🏢' },
    { name: 'Almacén A', description: 'Almacén de equipos de audio', icon: '📦' },
    { name: 'Set de rodaje', description: 'Área de rodaje activa', icon: '🎬' },
    { name: 'Almacén B', description: 'Almacén de cables y accesorios', icon: '🔌' },
  ];

  const createdLocations: any[] = [];
  for (const loc of locations) {
    const location = await prisma.location.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    });
    createdLocations.push(location);
    console.log(`✅ Ubicación creada: ${location.name}`);
  }

  // Crear items de ejemplo
  const items = [
    {
      code: 'kf-0001',
      name: 'Sony A7S III',
      description: 'Cámara mirrorless full frame para video profesional',
      categoryId: createdCategories[0].id,
      status: 'AVAILABLE',
      brand: 'Sony',
      model: 'A7S III',
      serialNumber: 'SN123456789',
      locationId: createdLocations[0].id, // Estudio Principal
      purchaseDate: new Date('2023-01-15'),
      purchaseValue: 3999.99,
    },
    {
      code: 'kf-0002',
      name: 'Rode NTG3',
      description: 'Micrófono de cañón para exteriores',
      categoryId: createdCategories[1].id,
      status: 'AVAILABLE',
      brand: 'Rode',
      model: 'NTG3',
      serialNumber: 'RD987654321',
      locationId: createdLocations[1].id, // Almacén A
      purchaseDate: new Date('2022-06-10'),
      purchaseValue: 699.00,
    },
    {
      code: 'kf-0003',
      name: 'Aputure 300d II',
      description: 'Luz LED de alta potencia',
      categoryId: createdCategories[2].id,
      status: 'IN_USE',
      brand: 'Aputure',
      model: '300d Mark II',
      locationId: createdLocations[2].id, // Set de rodaje
      purchaseDate: new Date('2023-03-20'),
      purchaseValue: 899.00,
    },
    {
      code: 'kf-0004',
      name: 'Cable XLR 10m',
      description: 'Cable XLR profesional de 10 metros',
      categoryId: createdCategories[3].id,
      status: 'AVAILABLE',
      brand: 'Mogami',
      locationId: createdLocations[3].id, // Almacén B
      purchaseValue: 45.00,
    },
    {
      code: 'kf-0005',
      name: 'Manfrotto 546B',
      description: 'Trípode profesional de video',
      categoryId: createdCategories[4].id,
      status: 'AVAILABLE',
      brand: 'Manfrotto',
      model: '546B',
      locationId: createdLocations[0].id, // Estudio Principal
      purchaseDate: new Date('2022-11-05'),
      purchaseValue: 459.00,
    },
  ];

  for (const item of items) {
    // Check if item already exists
    const existingItem = await prisma.item.findUnique({
      where: { code: item.code },
    });

    if (existingItem) {
      console.log(`ℹ️  Item ya existe: ${item.name} (${item.code}), omitiendo...`);
      continue;
    }

    const createdItem = await prisma.item.create({
      data: item,
    });
    console.log(`✅ Item creado: ${createdItem.name} (${createdItem.code})`);

    // Crear historial inicial
    await prisma.itemHistory.create({
      data: {
        itemId: createdItem.id,
        action: 'Creado',
        description: 'Item agregado al inventario',
        performedBy: 'Sistema',
        newStatus: createdItem.status,
      },
    });
  }

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
