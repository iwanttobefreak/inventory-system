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
  description: z.string().optional(),
  categoryId: z.string(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'REPAIR', 'LOST', 'RETIRED']).default('AVAILABLE'),
  locationId: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseValue: z.number().optional(),
  notes: z.string().optional(),
  attributes: z.record(z.any()).optional(), // Atributos personalizados como JSON
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

    const item = await prisma.item.create({
      data: {
        ...data,
        code, // Usar el código generado o provisto
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
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

    res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/items/:code - Actualizar item
router.put('/:code', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    const data = req.body;

    const oldItem = await prisma.item.findUnique({
      where: { code },
    });

    if (!oldItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = await prisma.item.update({
      where: { code },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      },
      include: {
        category: true,
        location: true,
      },
    });

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
    res.status(500).json({ error: 'Internal server error' });
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
    const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/item/${code}`;
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
