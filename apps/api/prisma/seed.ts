import 'dotenv/config'
import { randomBytes, scryptSync } from 'node:crypto'
import {
  AccessLevel,
  ActivityStatus,
  ActivityType,
  ChildGender,
  ChildCaregiverRole,
  PrismaClient,
  RecommendationKind,
  RecommendationStatus,
  SessionStatus,
  SkillCategory,
  UserRole,
} from '@prisma/client'

const prisma = new PrismaClient()

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${derivedKey}`
}

type SessionSeed = {
  activityCode: string
  childId: number
  locale: string
  status: SessionStatus
  startedAt: Date
  endedAt: Date
  difficultyStart?: number
  difficultyEnd?: number
  deviceType?: string
  metadata?: Record<string, unknown>
  events?: Array<{
    type: string
    occurredAt: Date
    payload?: Record<string, unknown>
  }>
  responses?: Array<{
    sequence: number
    promptType?: string
    prompt?: Record<string, unknown>
    expected?: Record<string, unknown>
    answer?: Record<string, unknown>
    isCorrect: boolean
    reactionMs?: number
    attemptNumber?: number
    helpUsed?: boolean
    hintsUsed?: number
    audioReplayCount?: number
    metadata?: Record<string, unknown>
    createdAt?: Date
  }>
}

function daysAgo(days: number, hour = 10, minute = 0) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date
}

function dateOnly(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(0, 0, 0, 0)
  return date
}

async function createDemoSession(sessionSeed: SessionSeed) {
  const activity = await prisma.activity.findUniqueOrThrow({
    where: { code: sessionSeed.activityCode },
    select: { id: true },
  })

  const responses = sessionSeed.responses ?? []
  const events = sessionSeed.events ?? []
  const correctResponses = responses.filter((response) => response.isCorrect).length
  const wrongResponses = responses.length - correctResponses
  const responseHelpCount = responses.reduce(
    (total, response) => total + (response.helpUsed ? 1 : 0) + (response.hintsUsed ?? 0),
    0
  )
  const responseAudioCount = responses.reduce(
    (total, response) => total + (response.audioReplayCount ?? 0),
    0
  )
  const eventHelpCount = events.filter((event) => event.type === 'hint_used').length
  const eventAudioCount = events.filter((event) =>
    ['audio_replayed', 'narration_replayed'].includes(event.type)
  ).length
  const durationMs = Math.max(0, sessionSeed.endedAt.getTime() - sessionSeed.startedAt.getTime())
  const completionRate =
    responses.length > 0 ? Number((correctResponses / responses.length).toFixed(2)) : null
  const score = responses.length > 0 ? Number(((correctResponses / responses.length) * 100).toFixed(1)) : null

  await prisma.activitySession.create({
    data: {
      childId: sessionSeed.childId,
      activityId: activity.id,
      locale: sessionSeed.locale,
      status: sessionSeed.status,
      startedAt: sessionSeed.startedAt,
      endedAt: sessionSeed.endedAt,
      durationMs,
      difficultyStart: sessionSeed.difficultyStart ?? null,
      difficultyEnd: sessionSeed.difficultyEnd ?? null,
      completionRate,
      score,
      totalResponses: responses.length,
      correctResponses,
      wrongResponses,
      helpCount: responseHelpCount + eventHelpCount,
      audioReplayCount: responseAudioCount + eventAudioCount,
      deviceType: sessionSeed.deviceType ?? 'tablet',
      metadata: sessionSeed.metadata ?? undefined,
      responses: responses.length
        ? {
            create: responses.map((response) => ({
              sequence: response.sequence,
              promptType: response.promptType,
              prompt: response.prompt,
              expected: response.expected,
              answer: response.answer,
              isCorrect: response.isCorrect,
              reactionMs: response.reactionMs ?? null,
              attemptNumber: response.attemptNumber ?? 1,
              helpUsed: response.helpUsed ?? false,
              hintsUsed: response.hintsUsed ?? 0,
              audioReplayCount: response.audioReplayCount ?? 0,
              metadata: response.metadata,
              createdAt: response.createdAt ?? sessionSeed.startedAt,
            })),
          }
        : undefined,
      events: events.length
        ? {
            create: events.map((event) => ({
              type: event.type,
              occurredAt: event.occurredAt,
              payload: event.payload,
            })),
          }
        : undefined,
    },
  })
}

async function main() {
  const parent = await prisma.user.upsert({
    where: { email: 'demo@coco.local' },
    update: {
      displayName: 'Rocio Demo',
      role: UserRole.parent,
    },
    create: {
      id: 1,
      email: 'demo@coco.local',
      passwordHash: 'dev',
      displayName: 'Rocio Demo',
      role: UserRole.parent,
    },
  })

  const therapist = await prisma.user.upsert({
    where: { email: 'therapist@coco.local' },
    update: {
      displayName: 'Lucia Terapeuta',
      role: UserRole.therapist,
    },
    create: {
      id: 2,
      email: 'therapist@coco.local',
      passwordHash: 'dev',
      displayName: 'Lucia Terapeuta',
      role: UserRole.therapist,
    },
  })

  const children = await Promise.all([
    prisma.child.upsert({
      where: { id: 1 },
      update: {
        name: 'Eduardo',
        loginName: 'eduardo',
        gender: ChildGender.boy,
        birthdate: new Date('2018-05-14'),
        passwordHash: hashPassword('coco1234'),
        adminPasswordHash: hashPassword('familia1234'),
        profile: {
          preferredLocale: 'es',
          supportNeeds: ['atencion', 'procesamiento_auditivo'],
        },
        settings: {
          preferredStimuli: ['campanas', 'globos'],
          defaultDifficulty: 1,
        },
      },
      create: {
        id: 1,
        name: 'Eduardo',
        loginName: 'eduardo',
        gender: ChildGender.boy,
        birthdate: new Date('2018-05-14'),
        passwordHash: hashPassword('coco1234'),
        adminPasswordHash: hashPassword('familia1234'),
        profile: {
          preferredLocale: 'es',
          supportNeeds: ['atencion', 'procesamiento_auditivo'],
        },
        settings: {
          preferredStimuli: ['campanas', 'globos'],
          defaultDifficulty: 1,
        },
      },
    }),
    prisma.child.upsert({
      where: { id: 2 },
      update: {
        name: 'Ines',
        loginName: 'ines',
        gender: ChildGender.girl,
        birthdate: new Date('2017-11-03'),
        passwordHash: hashPassword('coco1234'),
        adminPasswordHash: hashPassword('familia1234'),
        profile: {
          preferredLocale: 'pt',
          supportNeeds: ['lectura', 'motricidad_fina'],
        },
        settings: {
          preferredStimuli: ['cuentos', 'cartas'],
          defaultDifficulty: 2,
        },
      },
      create: {
        id: 2,
        name: 'Ines',
        loginName: 'ines',
        gender: ChildGender.girl,
        birthdate: new Date('2017-11-03'),
        passwordHash: hashPassword('coco1234'),
        adminPasswordHash: hashPassword('familia1234'),
        profile: {
          preferredLocale: 'pt',
          supportNeeds: ['lectura', 'motricidad_fina'],
        },
        settings: {
          preferredStimuli: ['cuentos', 'cartas'],
          defaultDifficulty: 2,
        },
      },
    }),
  ])

  await prisma.childCaregiver.upsert({
    where: {
      childId_userId: {
        childId: children[0].id,
        userId: parent.id,
      },
    },
    update: {
      relationship: ChildCaregiverRole.parent,
      accessLevel: AccessLevel.owner,
      isPrimary: true,
    },
    create: {
      childId: children[0].id,
      userId: parent.id,
      relationship: ChildCaregiverRole.parent,
      accessLevel: AccessLevel.owner,
      isPrimary: true,
    },
  })

  await prisma.childCaregiver.upsert({
    where: {
      childId_userId: {
        childId: children[0].id,
        userId: therapist.id,
      },
    },
    update: {
      relationship: ChildCaregiverRole.therapist,
      accessLevel: AccessLevel.editor,
      isPrimary: false,
    },
    create: {
      childId: children[0].id,
      userId: therapist.id,
      relationship: ChildCaregiverRole.therapist,
      accessLevel: AccessLevel.editor,
      isPrimary: false,
    },
  })

  await prisma.childCaregiver.upsert({
    where: {
      childId_userId: {
        childId: children[1].id,
        userId: parent.id,
      },
    },
    update: {
      relationship: ChildCaregiverRole.parent,
      accessLevel: AccessLevel.owner,
      isPrimary: true,
    },
    create: {
      childId: children[1].id,
      userId: parent.id,
      relationship: ChildCaregiverRole.parent,
      accessLevel: AccessLevel.owner,
      isPrimary: true,
    },
  })

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

  const demoChildIds = children.map((child) => child.id)
  await prisma.recommendation.deleteMany({ where: { childId: { in: demoChildIds } } })
  await prisma.childActivityDailyStat.deleteMany({ where: { childId: { in: demoChildIds } } })
  await prisma.childSkillSnapshot.deleteMany({ where: { childId: { in: demoChildIds } } })
  await prisma.activitySession.deleteMany({ where: { childId: { in: demoChildIds } } })

  await createDemoSession({
    activityCode: 'letters',
    childId: 1,
    locale: 'es',
    status: SessionStatus.completed,
    startedAt: daysAgo(1, 17, 10),
    endedAt: daysAgo(1, 17, 15),
    difficultyStart: 1,
    difficultyEnd: 1,
    responses: [
      { sequence: 1, promptType: 'letter_choice', expected: { letter: 'A' }, answer: { letter: 'A' }, isCorrect: true, reactionMs: 1800 },
      { sequence: 2, promptType: 'letter_choice', expected: { letter: 'E' }, answer: { letter: 'E' }, isCorrect: true, reactionMs: 2100 },
      { sequence: 3, promptType: 'letter_choice', expected: { letter: 'I' }, answer: { letter: 'I' }, isCorrect: true, reactionMs: 1950 },
      { sequence: 4, promptType: 'letter_choice', expected: { letter: 'O' }, answer: { letter: 'U' }, isCorrect: false, reactionMs: 3200, helpUsed: true, hintsUsed: 1 },
      { sequence: 5, promptType: 'letter_choice', expected: { letter: 'U' }, answer: { letter: 'U' }, isCorrect: true, reactionMs: 2050 },
      { sequence: 6, promptType: 'letter_choice', expected: { letter: 'M' }, answer: { letter: 'M' }, isCorrect: true, reactionMs: 1900 },
    ],
    events: [
      { type: 'session_started', occurredAt: daysAgo(1, 17, 10) },
      { type: 'hint_used', occurredAt: daysAgo(1, 17, 13), payload: { sequence: 4 } },
      { type: 'session_completed', occurredAt: daysAgo(1, 17, 15) },
    ],
  })

  await createDemoSession({
    activityCode: 'animal-sound',
    childId: 1,
    locale: 'pt',
    status: SessionStatus.completed,
    startedAt: daysAgo(2, 18, 0),
    endedAt: daysAgo(2, 18, 8),
    difficultyStart: 2,
    difficultyEnd: 1,
    responses: [
      { sequence: 1, promptType: 'animal_sound', expected: { animal: 'cao' }, answer: { animal: 'cao' }, isCorrect: true, reactionMs: 2400, audioReplayCount: 1 },
      { sequence: 2, promptType: 'animal_sound', expected: { animal: 'gato' }, answer: { animal: 'vaca' }, isCorrect: false, reactionMs: 4100, helpUsed: true, hintsUsed: 1, audioReplayCount: 1 },
      { sequence: 3, promptType: 'animal_sound', expected: { animal: 'vaca' }, answer: { animal: 'vaca' }, isCorrect: true, reactionMs: 2300 },
      { sequence: 4, promptType: 'animal_sound', expected: { animal: 'ovelha' }, answer: { animal: 'ovelha' }, isCorrect: true, reactionMs: 2600 },
      { sequence: 5, promptType: 'animal_sound', expected: { animal: 'pato' }, answer: { animal: 'galo' }, isCorrect: false, reactionMs: 4600, helpUsed: true, hintsUsed: 1 },
    ],
    events: [
      { type: 'audio_replayed', occurredAt: daysAgo(2, 18, 1), payload: { sequence: 1 } },
      { type: 'audio_replayed', occurredAt: daysAgo(2, 18, 3), payload: { sequence: 2 } },
      { type: 'difficulty_changed', occurredAt: daysAgo(2, 18, 5), payload: { from: 2, to: 1, reason: 'fatiga' } },
      { type: 'session_completed', occurredAt: daysAgo(2, 18, 8) },
    ],
  })

  await createDemoSession({
    activityCode: 'balloons',
    childId: 1,
    locale: 'es',
    status: SessionStatus.completed,
    startedAt: daysAgo(3, 16, 30),
    endedAt: daysAgo(3, 16, 36),
    difficultyStart: 2,
    difficultyEnd: 2,
    responses: [
      { sequence: 1, promptType: 'target_balloon', expected: { color: 'rojo' }, answer: { color: 'rojo' }, isCorrect: true, reactionMs: 1400 },
      { sequence: 2, promptType: 'target_balloon', expected: { color: 'azul' }, answer: { color: 'azul' }, isCorrect: true, reactionMs: 1250 },
      { sequence: 3, promptType: 'target_balloon', expected: { color: 'verde' }, answer: { color: 'verde' }, isCorrect: true, reactionMs: 1320 },
      { sequence: 4, promptType: 'target_balloon', expected: { color: 'amarillo' }, answer: { color: 'amarillo' }, isCorrect: true, reactionMs: 1280 },
      { sequence: 5, promptType: 'target_balloon', expected: { color: 'morado' }, answer: { color: 'naranja' }, isCorrect: false, reactionMs: 2200 },
      { sequence: 6, promptType: 'target_balloon', expected: { color: 'naranja' }, answer: { color: 'naranja' }, isCorrect: true, reactionMs: 1380 },
      { sequence: 7, promptType: 'target_balloon', expected: { color: 'rosa' }, answer: { color: 'rosa' }, isCorrect: true, reactionMs: 1210 },
      { sequence: 8, promptType: 'target_balloon', expected: { color: 'blanco' }, answer: { color: 'blanco' }, isCorrect: true, reactionMs: 1500 },
    ],
    events: [
      { type: 'session_started', occurredAt: daysAgo(3, 16, 30) },
      { type: 'session_completed', occurredAt: daysAgo(3, 16, 36) },
    ],
  })

  await createDemoSession({
    activityCode: 'stories-magic-forest',
    childId: 2,
    locale: 'pt',
    status: SessionStatus.completed,
    startedAt: daysAgo(1, 19, 5),
    endedAt: daysAgo(1, 19, 17),
    difficultyStart: 1,
    difficultyEnd: 1,
    events: [
      { type: 'session_started', occurredAt: daysAgo(1, 19, 5) },
      { type: 'page_changed', occurredAt: daysAgo(1, 19, 7), payload: { page: 2 } },
      { type: 'narration_replayed', occurredAt: daysAgo(1, 19, 9), payload: { page: 2 } },
      { type: 'page_changed', occurredAt: daysAgo(1, 19, 12), payload: { page: 3 } },
      { type: 'session_completed', occurredAt: daysAgo(1, 19, 17) },
    ],
    metadata: {
      pagesRead: 3,
      narrationEnabled: true,
    },
  })

  await createDemoSession({
    activityCode: 'numbers-cards',
    childId: 2,
    locale: 'es',
    status: SessionStatus.completed,
    startedAt: daysAgo(4, 17, 40),
    endedAt: daysAgo(4, 17, 47),
    difficultyStart: 2,
    difficultyEnd: 2,
    responses: [
      { sequence: 1, promptType: 'number_card', expected: { number: 3 }, answer: { number: 3 }, isCorrect: true, reactionMs: 1800 },
      { sequence: 2, promptType: 'number_card', expected: { number: 4 }, answer: { number: 4 }, isCorrect: true, reactionMs: 1760 },
      { sequence: 3, promptType: 'number_card', expected: { number: 6 }, answer: { number: 9 }, isCorrect: false, reactionMs: 2900, helpUsed: true, hintsUsed: 1 },
      { sequence: 4, promptType: 'number_card', expected: { number: 7 }, answer: { number: 7 }, isCorrect: true, reactionMs: 1820 },
      { sequence: 5, promptType: 'number_card', expected: { number: 8 }, answer: { number: 8 }, isCorrect: true, reactionMs: 1900 },
    ],
    events: [
      { type: 'hint_used', occurredAt: daysAgo(4, 17, 44), payload: { sequence: 3 } },
      { type: 'session_completed', occurredAt: daysAgo(4, 17, 47) },
    ],
  })

  const activityMap = Object.fromEntries(
    (await prisma.activity.findMany({ select: { id: true, code: true } })).map((activity) => [
      activity.code,
      activity.id,
    ])
  )
  const skillMap = Object.fromEntries(
    (await prisma.skill.findMany({ select: { id: true, code: true } })).map((skill) => [
      skill.code,
      skill.id,
    ])
  )

  const dailyStats = [
    {
      childId: 1,
      activityCode: 'letters',
      statDate: dateOnly(1),
      sessionsCount: 1,
      completedSessions: 1,
      abandonedSessions: 0,
      totalResponses: 6,
      correctResponses: 5,
      wrongResponses: 1,
      totalHelpUsed: 2,
      totalAudioReplays: 0,
      avgReactionMs: 2167,
      engagementScore: 0.78,
      preferenceScore: 0.66,
    },
    {
      childId: 1,
      activityCode: 'animal-sound',
      statDate: dateOnly(2),
      sessionsCount: 1,
      completedSessions: 1,
      abandonedSessions: 0,
      totalResponses: 5,
      correctResponses: 3,
      wrongResponses: 2,
      totalHelpUsed: 4,
      totalAudioReplays: 4,
      avgReactionMs: 3200,
      engagementScore: 0.69,
      preferenceScore: 0.82,
    },
    {
      childId: 1,
      activityCode: 'balloons',
      statDate: dateOnly(3),
      sessionsCount: 1,
      completedSessions: 1,
      abandonedSessions: 0,
      totalResponses: 8,
      correctResponses: 7,
      wrongResponses: 1,
      totalHelpUsed: 0,
      totalAudioReplays: 0,
      avgReactionMs: 1443,
      engagementScore: 0.91,
      preferenceScore: 0.95,
    },
    {
      childId: 2,
      activityCode: 'stories-magic-forest',
      statDate: dateOnly(1),
      sessionsCount: 1,
      completedSessions: 1,
      abandonedSessions: 0,
      totalResponses: 0,
      correctResponses: 0,
      wrongResponses: 0,
      totalHelpUsed: 0,
      totalAudioReplays: 1,
      avgReactionMs: null,
      engagementScore: 0.84,
      preferenceScore: 0.9,
    },
    {
      childId: 2,
      activityCode: 'numbers-cards',
      statDate: dateOnly(4),
      sessionsCount: 1,
      completedSessions: 1,
      abandonedSessions: 0,
      totalResponses: 5,
      correctResponses: 4,
      wrongResponses: 1,
      totalHelpUsed: 2,
      totalAudioReplays: 0,
      avgReactionMs: 2036,
      engagementScore: 0.76,
      preferenceScore: 0.72,
    },
  ] as const

  for (const stat of dailyStats) {
    await prisma.childActivityDailyStat.upsert({
      where: {
        childId_activityId_statDate: {
          childId: stat.childId,
          activityId: activityMap[stat.activityCode],
          statDate: stat.statDate,
        },
      },
      update: {
        sessionsCount: stat.sessionsCount,
        completedSessions: stat.completedSessions,
        abandonedSessions: stat.abandonedSessions,
        totalResponses: stat.totalResponses,
        correctResponses: stat.correctResponses,
        wrongResponses: stat.wrongResponses,
        totalHelpUsed: stat.totalHelpUsed,
        totalAudioReplays: stat.totalAudioReplays,
        avgReactionMs: stat.avgReactionMs,
        engagementScore: stat.engagementScore,
        preferenceScore: stat.preferenceScore,
      },
      create: {
        childId: stat.childId,
        activityId: activityMap[stat.activityCode],
        statDate: stat.statDate,
        sessionsCount: stat.sessionsCount,
        completedSessions: stat.completedSessions,
        abandonedSessions: stat.abandonedSessions,
        totalResponses: stat.totalResponses,
        correctResponses: stat.correctResponses,
        wrongResponses: stat.wrongResponses,
        totalHelpUsed: stat.totalHelpUsed,
        totalAudioReplays: stat.totalAudioReplays,
        avgReactionMs: stat.avgReactionMs,
        engagementScore: stat.engagementScore,
        preferenceScore: stat.preferenceScore,
      },
    })
  }

  const skillSnapshots = [
    { childId: 1, skillCode: 'letter_recognition', snapshotDate: dateOnly(1), attemptsCount: 18, correctCount: 15, accuracyRate: 0.83, avgReactionMs: 2100, confidenceScore: 0.71, masteryScore: 0.68 },
    { childId: 1, skillCode: 'auditory_discrimination', snapshotDate: dateOnly(2), attemptsCount: 10, correctCount: 6, accuracyRate: 0.6, avgReactionMs: 3200, confidenceScore: 0.52, masteryScore: 0.47 },
    { childId: 1, skillCode: 'visual_attention', snapshotDate: dateOnly(3), attemptsCount: 20, correctCount: 17, accuracyRate: 0.85, avgReactionMs: 1500, confidenceScore: 0.8, masteryScore: 0.78 },
    { childId: 2, skillCode: 'reading_comprehension', snapshotDate: dateOnly(1), attemptsCount: 6, correctCount: 5, accuracyRate: 0.83, avgReactionMs: 2400, confidenceScore: 0.75, masteryScore: 0.73 },
    { childId: 2, skillCode: 'numeracy', snapshotDate: dateOnly(4), attemptsCount: 12, correctCount: 9, accuracyRate: 0.75, avgReactionMs: 2050, confidenceScore: 0.68, masteryScore: 0.64 },
  ] as const

  for (const snapshot of skillSnapshots) {
    await prisma.childSkillSnapshot.upsert({
      where: {
        childId_skillId_snapshotDate: {
          childId: snapshot.childId,
          skillId: skillMap[snapshot.skillCode],
          snapshotDate: snapshot.snapshotDate,
        },
      },
      update: {
        attemptsCount: snapshot.attemptsCount,
        correctCount: snapshot.correctCount,
        accuracyRate: snapshot.accuracyRate,
        avgReactionMs: snapshot.avgReactionMs,
        confidenceScore: snapshot.confidenceScore,
        masteryScore: snapshot.masteryScore,
      },
      create: {
        childId: snapshot.childId,
        skillId: skillMap[snapshot.skillCode],
        snapshotDate: snapshot.snapshotDate,
        attemptsCount: snapshot.attemptsCount,
        correctCount: snapshot.correctCount,
        accuracyRate: snapshot.accuracyRate,
        avgReactionMs: snapshot.avgReactionMs,
        confidenceScore: snapshot.confidenceScore,
        masteryScore: snapshot.masteryScore,
      },
    })
  }

  const recommendations = [
    {
      childId: 1,
      activityCode: 'animal-sound',
      kind: RecommendationKind.difficulty_adjustment,
      priority: 92,
      title: 'Reducir la carga auditiva en Sonidos de animales',
      summary: 'Bajar temporalmente a nivel 1 y reforzar las ayudas visuales en las primeras rondas.',
      rationale: {
        signal: 'accuracy_drop',
        accuracy: 0.6,
        avgReactionMs: 3200,
      },
      suggestedConfig: {
        difficulty: 1,
        showVisualCue: true,
        maxOptions: 3,
      },
    },
    {
      childId: 1,
      activityCode: 'balloons',
      kind: RecommendationKind.next_activity,
      priority: 88,
      title: 'Usar Globos como actividad de activacion',
      summary: 'Es el juego con mejor engagement y mejor tiempo de respuesta. Puede usarse al inicio de sesion.',
      rationale: {
        engagementScore: 0.91,
        preferenceScore: 0.95,
      },
      suggestedConfig: {
        durationMinutes: 4,
        warmup: true,
      },
    },
    {
      childId: 2,
      activityCode: 'stories-magic-forest',
      kind: RecommendationKind.caregiver_tip,
      priority: 81,
      title: 'Repetir la narracion y hacer preguntas cortas',
      summary: 'Ines responde mejor cuando vuelve a escuchar una pagina y luego se le hace una pregunta breve.',
      rationale: {
        narrationReplays: 1,
        storyEngagement: 0.84,
      },
      suggestedConfig: {
        pauseAfterPage: true,
        promptSimpleQuestion: true,
      },
    },
  ] as const

  for (const recommendation of recommendations) {
    await prisma.recommendation.create({
      data: {
        childId: recommendation.childId,
        activityId: activityMap[recommendation.activityCode],
        kind: recommendation.kind,
        status: RecommendationStatus.active,
        priority: recommendation.priority,
        title: recommendation.title,
        summary: recommendation.summary,
        rationale: recommendation.rationale,
        suggestedConfig: recommendation.suggestedConfig,
        source: 'rules-v1',
      },
    })
  }

  console.log('Seed OK: analytics foundation ready')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
