import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('❌ Uso: tsx scripts/reset-password.ts <email> <nueva_contraseña>');
    console.error('   Ejemplo: tsx scripts/reset-password.ts admin@productora.com nueva_pass_123');
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const user = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Contraseña actualizada exitosamente para: ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Rol: ${user.role}`);
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error('❌ Error: Usuario no encontrado con ese email');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
