import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/locations/:locationId/attributes - Listar ubicaciones (sublocations) de un lugar o shelf
router.get('/:locationId/attributes', authenticate, async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;
    const { shelfId } = req.query;

    let attributes;
    
    if (shelfId) {
      // Si se proporciona shelfId, buscar ubicaciones de ese shelf
      attributes = await prisma.locationAttribute.findMany({
        where: { shelfId: shelfId as string },
        orderBy: { order: 'asc' },
      });
    } else {
      // Buscar por locationId (backward compatibility) o todas si locationId es 'all'
      if (locationId === 'all') {
        attributes = await prisma.locationAttribute.findMany({
          orderBy: { order: 'asc' },
        });
      } else {
        // Solo buscar por locationId directo (backward compatibility con sistema antiguo)
        attributes = await prisma.locationAttribute.findMany({
          where: { locationId },
          orderBy: { order: 'asc' },
        });
      }
    }

    res.json(attributes);
  } catch (error) {
    console.error('Error getting location attributes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/locations/:locationId/attributes - Crear ubicación (sublocation) para un lugar o shelf
router.post('/:locationId/attributes', authenticate, async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;
    const { code, name, description, order, shelfId } = req.body;

    console.log('📝 Creando ubicación:', { locationId, shelfId, code, name, description, order });

    // Si se proporciona shelfId, verificar que el shelf existe
    if (shelfId) {
      const shelf = await prisma.shelf.findUnique({
        where: { id: shelfId },
      });

      if (!shelf) {
        console.log('❌ Estantería no encontrada:', shelfId);
        return res.status(404).json({ error: 'Estantería no encontrada' });
      }
    } else {
      // Si no hay shelfId, verificar que el lugar existe (backward compatibility)
      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });

      if (!location) {
        console.log('❌ Lugar no encontrado:', locationId);
        return res.status(404).json({ error: 'Lugar no encontrado' });
      }
    }

    // Crear ubicación
    const dataToCreate: any = {
      code,
      name,
      description,
      order: order || 0,
    };

    // Agregar shelfId o locationId según corresponda
    if (shelfId) {
      dataToCreate.shelfId = shelfId;
    } else if (locationId && locationId !== 'all') {
      dataToCreate.locationId = locationId;
    }

    const attribute = await prisma.locationAttribute.create({
      data: dataToCreate,
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
    const { code, name, description, order, shelfId } = req.body;

    // Verificar que la ubicación existe
    const existingAttribute = await prisma.locationAttribute.findUnique({
      where: { id },
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
        ...(shelfId !== undefined && { shelfId }),
      } as any,
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
    const { id } = req.params;

    // Verificar que la ubicación existe
    const existingAttribute = await prisma.locationAttribute.findUnique({
      where: { id },
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
