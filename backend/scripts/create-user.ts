import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4];
  const role = (process.argv[5] || 'USER') as 'ADMIN' | 'USER';

  if (!email || !password || !name) {
    console.error('❌ Uso: tsx scripts/create-user.ts <email> <password> <name> [role]');
    console.error('   Ejemplo: tsx scripts/create-user.ts juan@productora.com pass123 "Juan Pérez" USER');
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    console.log('✅ Usuario creado exitosamente:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Rol: ${user.role}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('❌ Error: Ya existe un usuario con ese email');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
