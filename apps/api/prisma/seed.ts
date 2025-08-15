import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // user demo (id=1)
  const user = await prisma.user.upsert({
    where: { email: 'demo@coco.local' },
    update: {},
    create: {
      email: 'demo@coco.local',
      passwordHash: 'dev', // en serio: solo para demo SIN login
      role: 'parent'
    }
  })

  // child demo
  await prisma.child.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      userId: user.id,
      name: 'Eduardo'
    }
  })

  // game diccionario
  await prisma.game.upsert({
    where: { code: 'color_balloons' },
    update: {},
    create: { code: 'color_balloons', name: 'Globos de colores' }
  })

  console.log('Seed OK')
}

main().finally(() => prisma.$disconnect())
