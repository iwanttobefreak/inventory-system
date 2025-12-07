import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Flag para controlar si crear datos de demostración
  const createDemoData = process.env.SEED_DEMO_DATA === 'true';

  // Crear usuario admin (siempre se crea)
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

  if (!createDemoData) {
    console.log('ℹ️  SEED_DEMO_DATA=false - Solo se creó el usuario admin');
    console.log('🎉 Seed completado exitosamente!');
    return;
  }

  console.log('📦 Creando datos de demostración...');

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

  // Crear LUGARES (Locations)
  const locations = [
    { name: 'Almacén', description: 'Almacén principal de equipos', icon: '📦', color: '#3B82F6' },
    { name: 'Mantenimiento', description: 'Área de mantenimiento y reparaciones', icon: '🔧', color: '#F59E0B' },
    { name: 'Plató', description: 'Plató de grabación y producción', icon: '🎬', color: '#EF4444' },
    { name: 'Control', description: 'Sala de control técnico', icon: '🎛️', color: '#8B5CF6' },
    { name: 'Sonido', description: 'Estudio de grabación de sonido', icon: '🔊', color: '#10B981' },
    { name: 'Sala VR', description: 'Sala de realidad virtual', icon: '🥽', color: '#EC4899' },
  ];

  const createdLocations: any[] = [];
  for (const loc of locations) {
    const location = await prisma.location.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    });
    createdLocations.push(location);
    console.log(`✅ Lugar creado: ${location.name}`);
  }

  // Crear UBICACIONES (LocationAttributes) dentro de cada lugar
  const sublocationsData = [
    // Almacén - 4 ubicaciones
    { locationId: createdLocations[0].id, code: 'UB-0001', name: 'Estantería 1', description: 'Primera estantería', order: 1 },
    { locationId: createdLocations[0].id, code: 'UB-0002', name: 'Estantería 2', description: 'Segunda estantería', order: 2 },
    { locationId: createdLocations[0].id, code: 'UB-0003', name: 'Caja Cables', description: 'Caja de cables varios', order: 3 },
    { locationId: createdLocations[0].id, code: 'UB-0004', name: 'Caja Ópticas', description: 'Caja de equipos ópticos', order: 4 },
    // Mantenimiento - 2 ubicaciones
    { locationId: createdLocations[1].id, code: 'UB-0005', name: 'Mesa de trabajo', description: 'Mesa principal', order: 1 },
    { locationId: createdLocations[1].id, code: 'UB-0006', name: 'Armario herramientas', description: 'Armario', order: 2 },
    // Plató - 3 ubicaciones
    { locationId: createdLocations[2].id, code: 'UB-0007', name: 'Set A', description: 'Set de grabación A', order: 1 },
    { locationId: createdLocations[2].id, code: 'UB-0008', name: 'Set B', description: 'Set de grabación B', order: 2 },
    { locationId: createdLocations[2].id, code: 'UB-0009', name: 'Rack móvil', description: 'Rack de equipos móviles', order: 3 },
    // Control - 2 ubicaciones
    { locationId: createdLocations[3].id, code: 'UB-0010', name: 'Mesa de mezclas', description: 'Mesa principal', order: 1 },
    { locationId: createdLocations[3].id, code: 'UB-0011', name: 'Rack técnico', description: 'Rack de equipos', order: 2 },
    // Sonido - 2 ubicaciones
    { locationId: createdLocations[4].id, code: 'UB-0012', name: 'Cabina', description: 'Cabina de grabación', order: 1 },
    { locationId: createdLocations[4].id, code: 'UB-0013', name: 'Sala técnica', description: 'Sala de equipos', order: 2 },
    // Sala VR - 2 ubicaciones
    { locationId: createdLocations[5].id, code: 'UB-0014', name: 'Zona de juego', description: 'Área principal VR', order: 1 },
    { locationId: createdLocations[5].id, code: 'UB-0015', name: 'Almacén VR', description: 'Almacén de equipos VR', order: 2 },
  ];

  for (const sublocData of sublocationsData) {
    const subloc = await prisma.locationAttribute.upsert({
      where: { code: sublocData.code },
      update: {},
      create: sublocData,
    });
    const location = createdLocations.find(l => l.id === sublocData.locationId);
    console.log(`✅ Ubicación creada: ${subloc.code} - ${subloc.name} (${location?.name})`);
  }

  // Crear items de ejemplo
  const items = [
    {
      code: 'kf-0001',
      name: 'Sony A7S III',
      description: 'Cámara mirrorless full frame',
      categoryId: createdCategories[0].id,
      status: 'AVAILABLE',
      brand: 'Sony',
      model: 'A7S III',
      serialNumber: 'SN123456789',
      locationId: createdLocations[0].id,
      attributes: { sublocation: 'UB-0001' }, // Almacén - Estantería 1
      purchaseDate: new Date('2023-01-15'),
      purchaseValue: 3999.99,
    },
    {
      code: 'kf-0002',
      name: 'Rode NTG3',
      description: 'Micrófono de cañón',
      categoryId: createdCategories[1].id,
      status: 'AVAILABLE',
      brand: 'Rode',
      model: 'NTG3',
      serialNumber: 'RD987654321',
      locationId: createdLocations[4].id,
      attributes: { sublocation: 'UB-0012' }, // Sonido - Cabina
      purchaseDate: new Date('2022-06-10'),
      purchaseValue: 699.00,
    },
  ];

  for (const itemData of items) {
    try {
      const existingItem = await prisma.item.findUnique({
        where: { code: itemData.code },
      });

      if (existingItem) {
        console.log(`ℹ️  Item ya existe: ${itemData.name} (${itemData.code}), omitiendo...`);
        continue;
      }

      const item = await prisma.item.create({
        data: itemData,
      });
      console.log(`✅ Item creado: ${item.name} (${item.code})`);
    } catch (error) {
      console.error(`❌ Error creando item ${itemData.code}:`, error);
    }
  }

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
