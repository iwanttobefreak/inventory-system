import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import itemRoutes from './routes/items';
import categoryRoutes from './routes/categories';
import categoryAttributeRoutes from './routes/category-attributes';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Inventory API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/categories', categoryAttributeRoutes); // Rutas anidadas de atributos
app.use('/api/users', userRoutes);

// Manejo de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
