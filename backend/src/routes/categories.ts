import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/categories - Listar categorías
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories - Crear categoría
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, description, icon, color } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        description,
        icon,
        color,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/categories/:id - Actualizar categoría
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color } = req.body;

    // Verificar que la categoría existe
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Actualizar
    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        icon,
        color,
      },
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/categories/:id - Eliminar categoría
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que la categoría existe
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // No permitir eliminar si tiene items asociados
    if (existingCategory._count.items > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la categoría porque tiene ${existingCategory._count.items} items asociados` 
      });
    }

    // Eliminar
    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
