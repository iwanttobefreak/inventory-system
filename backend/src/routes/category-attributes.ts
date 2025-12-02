import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/categories/:categoryId/attributes - Listar atributos de una categoría
router.get('/:categoryId/attributes', authenticate, async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    const attributes = await prisma.categoryAttribute.findMany({
      where: { categoryId },
      orderBy: { order: 'asc' },
    });

    res.json(attributes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories/:categoryId/attributes - Crear atributo para una categoría
router.post('/:categoryId/attributes', authenticate, async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { name, key, type, options, required, order } = req.body;

    console.log('📝 Creando atributo:', { categoryId, name, key, type, options, required, order });

    // Verificar que la categoría existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      console.log('❌ Categoría no encontrada:', categoryId);
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Crear atributo
    const attribute = await prisma.categoryAttribute.create({
      data: {
        categoryId,
        name,
        key,
        type,
        options,
        required: required || false,
        order: order || 0,
      },
    });

    console.log('✅ Atributo creado:', attribute);
    res.status(201).json(attribute);
  } catch (error: any) {
    console.error('❌ Error creando atributo:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un atributo con esa clave en esta categoría' });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PUT /api/categories/:categoryId/attributes/:id - Actualizar atributo
router.put('/:categoryId/attributes/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id, categoryId } = req.params;
    const { name, key, type, options, required, order } = req.body;

    // Verificar que el atributo existe y pertenece a la categoría
    const existingAttribute = await prisma.categoryAttribute.findFirst({
      where: { id, categoryId },
    });

    if (!existingAttribute) {
      return res.status(404).json({ error: 'Atributo no encontrado' });
    }

    // Actualizar
    const attribute = await prisma.categoryAttribute.update({
      where: { id },
      data: {
        name,
        key,
        type,
        options,
        required,
        order,
      },
    });

    res.json(attribute);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un atributo con esa clave en esta categoría' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/categories/:categoryId/attributes/:id - Eliminar atributo
router.delete('/:categoryId/attributes/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id, categoryId } = req.params;

    // Verificar que el atributo existe y pertenece a la categoría
    const existingAttribute = await prisma.categoryAttribute.findFirst({
      where: { id, categoryId },
    });

    if (!existingAttribute) {
      return res.status(404).json({ error: 'Atributo no encontrado' });
    }

    // Eliminar
    await prisma.categoryAttribute.delete({
      where: { id },
    });

    res.json({ message: 'Atributo eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
