import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/locations/:locationId/attributes - Listar ubicaciones (sublocations) de un lugar
router.get('/:locationId/attributes', authenticate, async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;

    const attributes = await prisma.locationAttribute.findMany({
      where: { locationId },
      orderBy: { order: 'asc' },
    });

    res.json(attributes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/locations/:locationId/attributes - Crear ubicación (sublocation) para un lugar
router.post('/:locationId/attributes', authenticate, async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;
    const { code, name, description, order } = req.body;

    console.log('📝 Creando ubicación:', { locationId, code, name, description, order });

    // Verificar que el lugar existe
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      console.log('❌ Lugar no encontrado:', locationId);
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }

    // Crear ubicación
    const attribute = await prisma.locationAttribute.create({
      data: {
        locationId,
        code,
        name,
        description,
        order: order || 0,
      },
    });

    console.log('✅ Ubicación creada:', attribute);
    res.status(201).json(attribute);
  } catch (error: any) {
    console.error('❌ Error creando ubicación:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una ubicación con ese código' });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PUT /api/locations/:locationId/attributes/:id - Actualizar ubicación
router.put('/:locationId/attributes/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id, locationId } = req.params;
    const { code, name, description, order } = req.body;

    // Verificar que la ubicación existe y pertenece al lugar
    const existingAttribute = await prisma.locationAttribute.findFirst({
      where: { id, locationId },
    });

    if (!existingAttribute) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }

    // Actualizar
    const attribute = await prisma.locationAttribute.update({
      where: { id },
      data: {
        code,
        name,
        description,
        order,
      },
    });

    res.json(attribute);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una ubicación con ese código' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/locations/:locationId/attributes/:id - Eliminar ubicación
router.delete('/:locationId/attributes/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id, locationId } = req.params;

    // Verificar que la ubicación existe y pertenece al lugar
    const existingAttribute = await prisma.locationAttribute.findFirst({
      where: { id, locationId },
    });

    if (!existingAttribute) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }

    // Eliminar
    await prisma.locationAttribute.delete({
      where: { id },
    });

    res.json({ message: 'Ubicación eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
