import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validación
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

const adminUpdatePasswordSchema = z.object({
  newPassword: z.string().min(6),
});

// GET /api/users - Listar usuarios (solo ADMIN)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Verificar que el usuario es admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // NO incluir password
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users - Crear usuario (solo ADMIN)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Verificar que el usuario es admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    const { email, password, name, role } = createUserSchema.parse(req.body);

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/me/password - Cambiar propia contraseña
router.put('/me/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id/password - Cambiar contraseña de otro usuario (solo ADMIN)
router.put('/:id/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Verificar que el usuario es admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    const { id } = req.params;
    const { newPassword } = adminUpdatePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id - Actualizar usuario (solo ADMIN)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Verificar que el usuario es admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    const { id } = req.params;
    const { name, email, role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id - Eliminar usuario (solo ADMIN)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Verificar que el usuario es admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    const { id } = req.params;

    // No permitir eliminar el propio usuario
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
