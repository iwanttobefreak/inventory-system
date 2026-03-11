import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Configuración de multer para upload de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/items');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const code = req.params.code;
    const ext = path.extname(file.originalname);
    cb(null, `${code}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Función para generar el siguiente código kf-XXXX
async function getNextCode(): Promise<string> {
  const lastItem = await prisma.item.findFirst({
    where: {
      code: {
        startsWith: 'kf-',
      },
    },
    orderBy: {
      code: 'desc',
    },
  });

  if (!lastItem) {
    return 'kf-0001';
  }

  // Extraer el número del código (kf-0001 -> 0001)
  const match = lastItem.code.match(/kf-(\d+)/i);
  if (!match) {
    return 'kf-0001';
  }

  const lastNumber = parseInt(match[1], 10);
  const nextNumber = lastNumber + 1;
  return `kf-${nextNumber.toString().padStart(4, '0')}`;
}

// Validación
const createItemSchema = z.object({
  code: z.string().optional(), // Ahora es opcional, se genera automáticamente si no se provee
  name: z.string(),
  description: z.string().nullish(),
  categoryId: z.string(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'REPAIR', 'LOST', 'RETIRED']).default('AVAILABLE'),
  locationId: z.string().nullish(),
  shelfId: z.string().nullish(),
  brand: z.string().nullish(),
  model: z.string().nullish(),
  serialNumber: z.string().nullish(),
  purchaseDate: z.string().nullish(),
  purchaseValue: z.number().nullish(),
  notes: z.string().nullish(),
  attributes: z.record(z.any()).nullish(), // Atributos personalizados como JSON
});

// GET /api/items/next-code - Obtener el siguiente código disponible
router.get('/next-code', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const nextCode = await getNextCode();
    res.json({ code: nextCode });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/items - Listar todos los items (requiere autenticación)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { category, status, search } = req.query;

    const where: any = {};

    if (category) {
      where.categoryId = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        category: true,
        location: true,
        shelf: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/items/:code - Obtener item por código (autenticación opcional)
router.get('/:code', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;

    const item = await prisma.item.findUnique({
      where: { code },
      include: {
        category: true,
        location: true,
        history: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Si el usuario está autenticado, mostrar toda la información
    if (req.user) {
      return res.json(item);
    }

    // Si no está autenticado, mostrar solo info de devolución
    return res.json({
      code: item.code,
      name: item.name,
      isPublic: true,
      returnInfo: {
        company: process.env.COMPANY_NAME,
        phone: process.env.COMPANY_PHONE,
        email: process.env.COMPANY_EMAIL,
        address: process.env.COMPANY_ADDRESS,
        message: `Este equipo pertenece a ${process.env.COMPANY_NAME}. Si lo has encontrado, por favor contáctanos para devolverlo.`,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/items - Crear nuevo item
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = createItemSchema.parse(req.body);
    
    console.log('📝 Creating item with data:', JSON.stringify(data, null, 2));

    // Generar código automáticamente si no se provee
    const code = data.code || await getNextCode();

    // Verificar que el código no exista
    const existing = await prisma.item.findUnique({
      where: { code },
    });

    if (existing) {
      return res.status(400).json({ error: 'Item code already exists' });
    }

    // Generar URL del QR (ahora usa /kf-XXXX directamente)
    const qrUrl = `${process.env.FRONTEND_URL || 'https://kairoframe.lobo99.info'}/${code}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl);

    // Limpiar datos: convertir null a undefined para campos opcionales
    const cleanedData: any = {
      name: data.name,
      description: data.description ?? undefined,
      categoryId: data.categoryId,
      status: data.status,
      locationId: data.locationId ?? undefined,
      shelfId: data.shelfId ?? undefined,
      brand: data.brand ?? undefined,
      model: data.model ?? undefined,
      serialNumber: data.serialNumber ?? undefined,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      purchaseValue: data.purchaseValue ?? undefined,
      notes: data.notes ?? undefined,
      attributes: data.attributes ?? undefined,
    };

    console.log('📝 Cleaned data for Prisma:', JSON.stringify(cleanedData, null, 2));

    const item = await prisma.item.create({
      data: {
        ...cleanedData,
        code,
        qrCodeUrl: qrCodeDataUrl,
      },
      include: {
        category: true,
      },
    });

    // Crear historial
    await prisma.itemHistory.create({
      data: {
        itemId: item.id,
        action: 'Creado',
        description: 'Item agregado al inventario',
        performedBy: req.user?.email || 'Usuario',
        newStatus: item.status,
      },
    });

    console.log('✅ Item created successfully:', item.id);
    res.status(201).json(item);
  } catch (error) {
    console.error('❌ Error creating item:', error);
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({ error: formattedErrors });
    }
    res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
});

// PUT /api/items/:code - Actualizar item
router.put('/:code', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    let data = req.body;

    console.log('📝 PUT /items/:code - code:', code);
    console.log('📝 PUT /items/:code - data:', JSON.stringify(data, null, 2));

    // Filtrar campos que no existen en el modelo y eliminar valores null/undefined
    const { location, ...validData } = data;
    Object.keys(validData).forEach(key => {
      if (validData[key] === undefined || validData[key] === null || validData[key] === '') {
        delete validData[key];
      }
    });
    data = validData;

    console.log('📝 PUT /items/:code - code:', code);
    console.log('📝 PUT /items/:code - data:', JSON.stringify(data, null, 2));

    const oldItem = await prisma.item.findUnique({
      where: { code },
    });

    if (!oldItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Limpiar datos: filtrar campos undefined/null y campos que no existen en Prisma
    const cleanedData: any = {};
    
    if (data.name !== undefined && data.name !== null) cleanedData.name = data.name;
    if (data.description !== undefined) cleanedData.description = data.description || undefined;
    if (data.categoryId !== undefined && data.categoryId !== null) cleanedData.categoryId = data.categoryId;
    if (data.status !== undefined && data.status !== null) cleanedData.status = data.status;
    if (data.locationId !== undefined) cleanedData.locationId = data.locationId || undefined;
    if (data.shelfId !== undefined) cleanedData.shelfId = data.shelfId || undefined;
    if (data.brand !== undefined) cleanedData.brand = data.brand || undefined;
    if (data.model !== undefined) cleanedData.model = data.model || undefined;
    if (data.serialNumber !== undefined) cleanedData.serialNumber = data.serialNumber || undefined;
    if (data.purchaseDate !== undefined) cleanedData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : undefined;
    if (data.purchaseValue !== undefined) cleanedData.purchaseValue = data.purchaseValue ?? undefined;
    if (data.notes !== undefined) cleanedData.notes = data.notes || undefined;
    if (data.attributes !== undefined) cleanedData.attributes = data.attributes || undefined;

    console.log('📝 Cleaned data for Prisma:', JSON.stringify(cleanedData, null, 2));

    const item = await prisma.item.update({
      where: { code },
      data: cleanedData,
      include: {
        category: true,
        location: true,
      },
    });

    console.log('✅ PUT /items/:code - updated item:', item.id);

    // Crear historial si cambió el estado
    if (data.status && data.status !== oldItem.status) {
      await prisma.itemHistory.create({
        data: {
          itemId: item.id,
          action: 'Cambio de estado',
          description: `Estado cambiado de ${oldItem.status} a ${data.status}`,
          performedBy: req.user?.email || 'Usuario',
          oldStatus: oldItem.status,
          newStatus: data.status,
        },
      });
    }

    res.json(item);
  } catch (error) {
    console.error('❌ PUT /items/:code - ERROR:', error);
    res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
});

// DELETE /api/items/:code - Eliminar item
router.delete('/:code', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;

    await prisma.item.delete({
      where: { code },
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/items/:code/qr - Obtener QR del item
router.get('/:code/qr', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;

    const item = await prisma.item.findUnique({
      where: { code },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.qrCodeUrl) {
      return res.json({ qrCode: item.qrCodeUrl });
    }

    // Generar QR si no existe
    const qrUrl = `${process.env.FRONTEND_URL || 'http://frontend:3000'}/item/${code}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl);

    // Actualizar item con el QR
    await prisma.item.update({
      where: { code },
      data: { qrCodeUrl: qrCodeDataUrl },
    });

    res.json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/items/:code/image - Subir imagen para un item
router.post('/:code/image', authenticate, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;

    // Verificar que el item existe
    const item = await prisma.item.findUnique({
      where: { code },
    });

    if (!item) {
      // Si se subió archivo, eliminarlo
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Item not found' });
    }

    // Si no se subió archivo
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Si el item ya tenía una imagen, eliminar la anterior
    if (item.imageUrl) {
      const oldImagePath = path.join(__dirname, '../../uploads/items', path.basename(item.imageUrl));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Generar URL de la imagen
    const imageUrl = `/uploads/items/${req.file.filename}`;

    // Actualizar item con la nueva imagen
    const updatedItem = await prisma.item.update({
      where: { code },
      data: { imageUrl },
      include: {
        category: true,
        location: true,
      },
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Error uploading image:', error);
    // Si hay error, eliminar archivo subido
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/items/:code/image - Eliminar imagen de un item
router.delete('/:code/image', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;

    const item = await prisma.item.findUnique({
      where: { code },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (!item.imageUrl) {
      return res.status(400).json({ error: 'Item has no image' });
    }

    // Eliminar archivo físico
    const imagePath = path.join(__dirname, '../../uploads/items', path.basename(item.imageUrl));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Actualizar item quitando la imagen
    const updatedItem = await prisma.item.update({
      where: { code },
      data: { imageUrl: null },
      include: {
        category: true,
        location: true,
      },
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
