import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validación
const createLocationSchema = z.object({
  code: z.string().min(1, 'El código es requerido').regex(/^UB-\d{4}$/, 'El código debe tener el formato UB-XXXX'),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
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
