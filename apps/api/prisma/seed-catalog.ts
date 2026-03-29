import 'dotenv/config'
import {
  ActivityStatus,
  ActivityType,
  PrismaClient,
  SkillCategory,
} from '@prisma/client'

const prisma = new PrismaClient()

const activities = [
  {
    code: 'letters',
    name: 'Letras',
    description: 'Reconocimiento de letras y asociacion visual.',
    type: ActivityType.game,
    config: { adaptive: true, recommendedAge: '5-8' },
  },
  {
    code: 'animal-sound',
    name: 'Sonidos de animales',
    description: 'Discriminacion auditiva con apoyo visual.',
    type: ActivityType.game,
    config: { adaptive: true, recommendedAge: '4-7' },
  },
  {
    code: 'balloons',
    name: 'Globos',
    description: 'Atencion selectiva y reaccion motora.',
    type: ActivityType.game,
    config: { adaptive: true, recommendedAge: '4-8' },
  },
  {
    code: 'numbers-cards',
    name: 'Cartas numericas',
    description: 'Relacion numero-cantidad y memoria visual.',
    type: ActivityType.game,
    config: { adaptive: true, recommendedAge: '5-8' },
  },
  {
    code: 'stories-magic-forest',
    name: 'El Bosque Magico',
    description: 'Lectura acompanada con narracion.',
    type: ActivityType.story,
    config: { supportsNarration: true },
  },
  {
    code: 'blackboard-free',
    name: 'Pizarra libre',
    description: 'Exploracion grafomotora en pizarra.',
    type: ActivityType.blackboard,
    config: { supportsTracing: true },
  },
] as const

const skills = [
  {
    code: 'letter_recognition',
    name: 'Reconocimiento de letras',
    category: SkillCategory.literacy,
  },
  {
    code: 'auditory_discrimination',
    name: 'Discriminacion auditiva',
    category: SkillCategory.auditory,
  },
  {
    code: 'visual_attention',
    name: 'Atencion visual',
    category: SkillCategory.attention,
  },
  {
    code: 'numeracy',
    name: 'Numeracia inicial',
    category: SkillCategory.numeracy,
  },
  {
    code: 'fine_motor',
    name: 'Motricidad fina',
    category: SkillCategory.motor,
  },
  {
    code: 'reading_comprehension',
    name: 'Comprension lectora',
    category: SkillCategory.language,
  },
] as const

const activitySkillLinks = [
  { activityCode: 'letters', skillCode: 'letter_recognition', weight: 1.2 },
  { activityCode: 'letters', skillCode: 'visual_attention', weight: 0.8 },
  { activityCode: 'animal-sound', skillCode: 'auditory_discrimination', weight: 1.3 },
  { activityCode: 'animal-sound', skillCode: 'visual_attention', weight: 0.7 },
  { activityCode: 'balloons', skillCode: 'visual_attention', weight: 1.2 },
  { activityCode: 'balloons', skillCode: 'fine_motor', weight: 0.9 },
  { activityCode: 'numbers-cards', skillCode: 'numeracy', weight: 1.2 },
  { activityCode: 'numbers-cards', skillCode: 'visual_attention', weight: 0.6 },
  { activityCode: 'stories-magic-forest', skillCode: 'reading_comprehension', weight: 1.1 },
  { activityCode: 'blackboard-free', skillCode: 'fine_motor', weight: 1.0 },
] as const

async function main() {
  for (const activity of activities) {
    await prisma.activity.upsert({
      where: { code: activity.code },
      update: {
        name: activity.name,
        description: activity.description,
        type: activity.type,
        status: ActivityStatus.active,
        config: activity.config,
      },
      create: {
        code: activity.code,
        name: activity.name,
        description: activity.description,
        type: activity.type,
        status: ActivityStatus.active,
        config: activity.config,
      },
    })
  }

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { code: skill.code },
      update: {
        name: skill.name,
        category: skill.category,
      },
      create: {
        code: skill.code,
        name: skill.name,
        category: skill.category,
      },
    })
  }

  for (const link of activitySkillLinks) {
    const activity = await prisma.activity.findUniqueOrThrow({
      where: { code: link.activityCode },
      select: { id: true },
    })
    const skill = await prisma.skill.findUniqueOrThrow({
      where: { code: link.skillCode },
      select: { id: true },
    })

    await prisma.activitySkill.upsert({
      where: {
        activityId_skillId: {
          activityId: activity.id,
          skillId: skill.id,
        },
      },
      update: {
        weight: link.weight,
      },
      create: {
        activityId: activity.id,
        skillId: skill.id,
        weight: link.weight,
      },
    })
  }

  console.log('Catalog seeded successfully')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
