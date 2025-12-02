import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('ℹ️  No hay usuarios en el sistema');
      return;
    }

    console.log(`\n📋 Total de usuarios: ${users.length}\n`);
    console.log('═'.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name}`);
      console.log(`   ID:      ${user.id}`);
      console.log(`   Email:   ${user.email}`);
      console.log(`   Rol:     ${user.role === 'ADMIN' ? '👑 ADMIN' : '👤 USER'}`);
      console.log(`   Creado:  ${user.createdAt.toLocaleString('es-ES')}`);
      console.log(`   Actualizado: ${user.updatedAt.toLocaleString('es-ES')}`);
    });
    
    console.log('\n' + '═'.repeat(80) + '\n');
  } catch (error: any) {
    console.error('❌ Error al listar usuarios:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
