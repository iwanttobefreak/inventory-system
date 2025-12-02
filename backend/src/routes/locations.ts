import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/locations');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'location-' + uniqueSuffix + path.extname(file.filename));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
});

// Validación
const createLocationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

const updateLocationSchema = createLocationSchema.partial();

// GET /api/locations - Obtener todas las ubicaciones
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    res.json(locations);
  } catch (error) {
    console.error('Error getting locations:', error);
    res.status(500).json({ error: 'Error al obtener ubicaciones' });
  }
});

// GET /api/locations/:id - Obtener una ubicación específica
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    if (!location) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }

    res.json(location);
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(500).json({ error: 'Error al obtener ubicación' });
  }
});

// POST /api/locations - Crear nueva ubicación
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createLocationSchema.parse(req.body);

    const location = await prisma.location.create({
      data: validatedData,
    });

    res.status(201).json(location);
  } catch (error: any) {
    console.error('Error creating location:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una ubicación con ese nombre' });
    }
    
    res.status(500).json({ error: 'Error al crear ubicación' });
  }
});

// PUT /api/locations/:id - Actualizar ubicación
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateLocationSchema.parse(req.body);

    const location = await prisma.location.update({
      where: { id },
      data: validatedData,
    });

    res.json(location);
  } catch (error: any) {
    console.error('Error updating location:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una ubicación con ese nombre' });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }
    
    res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
});

// POST /api/locations/:id/image - Subir imagen de ubicación
router.post('/:id/image', authenticate, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    // Obtener ubicación actual para eliminar imagen anterior
    const currentLocation = await prisma.location.findUnique({
      where: { id }
    });

    if (!currentLocation) {
      // Eliminar archivo subido
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }

    // Eliminar imagen anterior si existe
    if (currentLocation.image) {
      const oldImagePath = path.join(__dirname, '../../', currentLocation.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Actualizar con nueva imagen
    const imagePath = `/uploads/locations/${req.file.filename}`;
    const location = await prisma.location.update({
      where: { id },
      data: { image: imagePath }
    });

    res.json(location);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
});

// DELETE /api/locations/:id - Eliminar ubicación
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar si hay items asociados
    const itemCount = await prisma.item.count({
      where: { locationId: id }
    });

    if (itemCount > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la ubicación porque tiene ${itemCount} item(s) asociado(s).` 
      });
    }

    // Obtener ubicación para eliminar imagen
    const location = await prisma.location.findUnique({
      where: { id }
    });

    if (location && location.image) {
      const imagePath = path.join(__dirname, '../../', location.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await prisma.location.delete({
      where: { id },
    });

    res.json({ message: 'Ubicación eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error deleting location:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }
    
    res.status(500).json({ error: 'Error al eliminar ubicación' });
  }
});

export default router;
