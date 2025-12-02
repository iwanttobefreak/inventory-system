import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Uso: npx tsx scripts/delete-user.ts <email>');
    console.error('   Ejemplo: npx tsx scripts/delete-user.ts usuario@eliminar.com');
    process.exit(1);
  }

  try {
    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.error(`❌ Error: No se encontró usuario con email: ${email}`);
      process.exit(1);
    }

    console.log('⚠️  Vas a eliminar el siguiente usuario:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Rol: ${user.role}`);
    console.log('');

    // Delete the user
    await prisma.user.delete({
      where: { email },
    });

    console.log(`✅ Usuario eliminado exitosamente: ${email}`);
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error('❌ Error: Usuario no encontrado');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
