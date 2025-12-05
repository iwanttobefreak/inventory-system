import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/shelves - Obtener todas las estanterías
router.get('/', async (req, res) => {
  try {
    const { locationId } = req.query;
    
    const shelves = await prisma.shelf.findMany({
      where: locationId ? { locationId: locationId as string } : undefined,
      include: {
        location: true,
        sublocations: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });
    
    res.json({ data: shelves });
  } catch (error) {
    console.error('Error fetching shelves:', error);
    res.status(500).json({ error: 'Error al obtener estanterías' });
  }
});

// GET /api/shelves/:id - Obtener una estantería por ID
router.get('/:id', async (req, res) => {
  try {
    const shelf = await prisma.shelf.findUnique({
      where: { id: req.params.id },
      include: {
        location: true,
        sublocations: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!shelf) {
      return res.status(404).json({ error: 'Estantería no encontrada' });
    }
    
    res.json({ data: shelf });
  } catch (error) {
    console.error('Error fetching shelf:', error);
    res.status(500).json({ error: 'Error al obtener estantería' });
  }
});

// POST /api/shelves - Crear una nueva estantería
router.post('/', async (req, res) => {
  try {
    const { locationId, code, name, description, order } = req.body;
    
    // Validar que el código tenga el formato ES-XXXX
    if (!code.match(/^ES-\d{4}$/)) {
      return res.status(400).json({ error: 'El código debe tener el formato ES-XXXX (ej: ES-0001)' });
    }
    
    const shelf = await prisma.shelf.create({
      data: {
        locationId,
        code,
        name,
        description,
        order: order || 0
      },
      include: {
        location: true
      }
    });
    
    res.status(201).json({ data: shelf });
  } catch (error: any) {
    console.error('Error creating shelf:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe una estantería con ese código' });
    } else {
      res.status(500).json({ error: 'Error al crear estantería' });
    }
  }
});

// PUT /api/shelves/:id - Actualizar una estantería
router.put('/:id', async (req, res) => {
  try {
    const { code, name, description, order } = req.body;
    
    // Si se actualiza el código, validar formato
    if (code && !code.match(/^ES-\d{4}$/)) {
      return res.status(400).json({ error: 'El código debe tener el formato ES-XXXX (ej: ES-0001)' });
    }
    
    const shelf = await prisma.shelf.update({
      where: { id: req.params.id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order })
      },
      include: {
        location: true
      }
    });
    
    res.json({ data: shelf });
  } catch (error: any) {
    console.error('Error updating shelf:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe una estantería con ese código' });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'Estantería no encontrada' });
    } else {
      res.status(500).json({ error: 'Error al actualizar estantería' });
    }
  }
});

// DELETE /api/shelves/:id - Eliminar una estantería
router.delete('/:id', async (req, res) => {
  try {
    await prisma.shelf.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Estantería eliminada correctamente' });
  } catch (error: any) {
    console.error('Error deleting shelf:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Estantería no encontrada' });
    } else {
      res.status(500).json({ error: 'Error al eliminar estantería' });
    }
  }
});

export default router;
