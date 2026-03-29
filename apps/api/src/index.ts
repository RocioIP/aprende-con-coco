import 'dotenv/config'
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import cors, { type CorsOptionsDelegate } from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import {
  AccessLevel,
  ActivityType,
  ChildGender,
  ChildCaregiverRole,
  PrismaClient,
  RecommendationStatus,
  SessionStatus,
} from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()
const app = express()

const sessionStatusSchema = z.enum(['started', 'completed', 'abandoned', 'interrupted'])
const childGenderSchema = z.enum(['boy', 'girl'])

const registerChildSchema = z.object({
  name: z.string().trim().min(1, 'name_required'),
  gender: childGenderSchema,
  birthdate: z.coerce.date(),
  password: z.string().min(4, 'password_too_short').max(64),
  adminPassword: z.string().min(4, 'admin_password_too_short').max(64),
})

const loginChildSchema = z.object({
  name: z.string().trim().min(1, 'name_required'),
  password: z.string().min(1, 'password_required'),
})

const unlockAdminSchema = z.object({
  adminPassword: z.string().min(1, 'admin_password_required'),
})

const childCreateSchema = z.object({
  name: z.string().trim().min(1, 'name_required'),
  gender: z.nativeEnum(ChildGender),
  birthdate: z.coerce.date(),
  password: z.string().min(4).max(64),
  adminPassword: z.string().min(4).max(64),
  loginName: z.string().trim().min(1).optional(),
  profile: z.any().optional(),
  settings: z.any().optional(),
  userId: z.number().int().positive().optional(),
  caregivers: z
    .array(
      z.object({
        userId: z.number().int().positive(),
        relationship: z.nativeEnum(ChildCaregiverRole).default(ChildCaregiverRole.parent),
        accessLevel: z.nativeEnum(AccessLevel).default(AccessLevel.editor),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),
})

const sessionStartSchema = z.object({
  childId: z.number().int().positive().optional(),
  activityCode: z.string().trim().min(1),
  locale: z.string().trim().min(2).max(10).default('es'),
  difficultyStart: z.number().int().min(0).max(10).optional(),
  deviceType: z.string().trim().max(50).optional(),
  metadata: z.any().optional(),
})

const responseInputSchema = z.object({
  sequence: z.number().int().min(1),
  promptType: z.string().trim().max(80).optional(),
  prompt: z.any().optional(),
  expected: z.any().optional(),
  answer: z.any().optional(),
  isCorrect: z.boolean(),
  reactionMs: z.number().int().min(0).nullable().optional(),
  attemptNumber: z.number().int().min(1).optional(),
  helpUsed: z.boolean().optional(),
  hintsUsed: z.number().int().min(0).optional(),
  audioReplayCount: z.number().int().min(0).optional(),
  metadata: z.any().optional(),
})

const sessionResponsesSchema = z.object({
  responses: z.array(responseInputSchema).min(1),
})

const interactionEventInputSchema = z.object({
  responseId: z.number().int().positive().optional(),
  type: z.string().trim().min(1).max(80),
  occurredAt: z.coerce.date().optional(),
  payload: z.any().optional(),
})

const sessionEventsSchema = z.object({
  events: z.array(interactionEventInputSchema).min(1),
})

const sessionFinishSchema = z.object({
  status: sessionStatusSchema.exclude(['started']).default('completed'),
  difficultyEnd: z.number().int().min(0).max(10).optional(),
  completionRate: z.number().min(0).max(1).optional(),
  score: z.number().min(0).max(100).optional(),
  metadata: z.any().optional(),
})

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'name_required'),
  gender: z.nativeEnum(ChildGender),
  birthdate: z.coerce.date(),
})

const FINAL_SESSION_STATUSES = [
  SessionStatus.completed,
  SessionStatus.abandoned,
  SessionStatus.interrupted,
] as const

const SESSION_COOKIE_NAME = 'coco_child_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7
const SESSION_SECRET = process.env.SESSION_SECRET || 'local-dev-secret-change-me'

type AuthSessionPayload = {
  childId: number
  adminUnlocked: boolean
  exp: number
}

function normalizeLoginName(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${derivedKey}`
}

function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split(':')

  if (algorithm !== 'scrypt' || !salt || !hash) {
    return false
  }

  const derivedKey = scryptSync(password, salt, 64)
  const storedKey = Buffer.from(hash, 'hex')

  if (storedKey.length !== derivedKey.length) {
    return false
  }

  return timingSafeEqual(storedKey, derivedKey)
}

function signSessionToken(payload: AuthSessionPayload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', SESSION_SECRET).update(data).digest('base64url')
  return `${data}.${signature}`
}

function parseCookies(cookieHeader?: string) {
  if (!cookieHeader) {
    return {}
  }

  return cookieHeader.split(';').reduce(
    (accumulator, item) => {
      const [key, ...valueParts] = item.trim().split('=')
      accumulator[key] = decodeURIComponent(valueParts.join('='))
      return accumulator
    },
    {} as Record<string, string>
  )
}

function readAuthSession(req: Request): AuthSessionPayload | null {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME]

  if (!token) {
    return null
  }

  const [data, signature] = token.split('.')

  if (!data || !signature) {
    return null
  }

  const expectedSignature = createHmac('sha256', SESSION_SECRET).update(data).digest('base64url')

  if (signature.length !== expectedSignature.length) {
    return null
  }

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as AuthSessionPayload

    if (!payload.childId || payload.exp <= Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

function serializeCookie(name: string, value: string, options?: { maxAge?: number; expires?: Date }) {
  const segments = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly']

  if (process.env.NODE_ENV === 'production') {
    segments.push('SameSite=None')
    segments.push('Secure')
  } else {
    segments.push('SameSite=Lax')
  }

  if (options?.maxAge !== undefined) {
    segments.push(`Max-Age=${options.maxAge}`)
  }

  if (options?.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`)
  }

  return segments.join('; ')
}

function setAuthSessionCookie(
  res: Response,
  payload: Omit<AuthSessionPayload, 'exp'>,
  maxAgeSeconds = SESSION_DURATION_SECONDS
) {
  const exp = Date.now() + maxAgeSeconds * 1000
  const token = signSessionToken({
    ...payload,
    exp,
  })

  res.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE_NAME, token, {
      maxAge: maxAgeSeconds,
      expires: new Date(exp),
    })
  )
}

function clearAuthSessionCookie(res: Response) {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE_NAME, '', {
      maxAge: 0,
      expires: new Date(0),
    })
  )
}

async function requireChildSession(req: Request, res: Response) {
  const session = readAuthSession(req)

  if (!session) {
    res.status(401).json({ error: 'auth_required' })
    return null
  }

  const child = await prisma.child.findUnique({
    where: { id: session.childId },
    select: {
      id: true,
      name: true,
      loginName: true,
      gender: true,
      birthdate: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!child) {
    clearAuthSessionCookie(res)
    res.status(401).json({ error: 'session_invalid' })
    return null
  }

  return {
    session,
    child,
  }
}

async function requireAdminSession(req: Request, res: Response) {
  const auth = await requireChildSession(req, res)

  if (!auth) {
    return null
  }

  if (!auth.session.adminUnlocked) {
    res.status(403).json({ error: 'admin_required' })
    return null
  }

  return auth
}

app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(helmet())
app.use(express.json())

const isDev = process.env.NODE_ENV !== 'production'
const prodAllowlist = ['https://aprende-con-coco.vercel.app', process.env.CORS_ORIGIN].filter(
  Boolean
) as string[]

const corsOrigin: CorsOptionsDelegate<Request> = (origin, cb) => {
  if (!origin) return cb(null, true)

  if (isDev && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    return cb(null, true)
  }

  if (prodAllowlist.includes(origin)) {
    return cb(null, true)
  }

  if (/^https:\/\/aprende-con-coco(-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) {
    return cb(null, true)
  }

  return cb(new Error('Not allowed by CORS'))
}

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
} as Parameters<typeof cors>[0]

app.use(cors(corsOptions))

function parseNumericParam(value: string, paramName: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`${paramName}_invalid`)
    ;(error as Error & { status?: number }).status = 400
    throw error
  }

  return parsed
}

async function refreshSessionStats(sessionId: number) {
  const [responses, events] = await Promise.all([
    prisma.activityResponse.findMany({
      where: { sessionId },
      select: {
        isCorrect: true,
        helpUsed: true,
        hintsUsed: true,
        audioReplayCount: true,
      },
    }),
    prisma.interactionEvent.findMany({
      where: {
        sessionId,
        type: {
          in: ['hint_used', 'audio_replayed', 'narration_replayed'],
        },
      },
      select: { type: true },
    }),
  ])

  const correctResponses = responses.filter((response) => response.isCorrect).length
  const wrongResponses = responses.length - correctResponses
  const responseHelpCount = responses.reduce(
    (total, response) => total + (response.helpUsed ? 1 : 0) + response.hintsUsed,
    0
  )
  const responseAudioCount = responses.reduce(
    (total, response) => total + response.audioReplayCount,
    0
  )
  const eventHelpCount = events.filter((event) => event.type === 'hint_used').length
  const eventAudioCount = events.filter((event) =>
    ['audio_replayed', 'narration_replayed'].includes(event.type)
  ).length

  return prisma.activitySession.update({
    where: { id: sessionId },
    data: {
      totalResponses: responses.length,
      correctResponses,
      wrongResponses,
      helpCount: responseHelpCount + eventHelpCount,
      audioReplayCount: responseAudioCount + eventAudioCount,
    },
  })
}

function startOfDay(date: Date) {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function nextDay(date: Date) {
  const normalized = new Date(date)
  normalized.setDate(normalized.getDate() + 1)
  return normalized
}

function roundMetric(value: number | null, decimals = 2) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }

  return Number(value.toFixed(decimals))
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

async function syncChildActivityDailyStat(childId: number, activityId: number, statDate: Date) {
  const dayStart = startOfDay(statDate)
  const dayEnd = nextDay(dayStart)

  const sessions = await prisma.activitySession.findMany({
    where: {
      childId,
      activityId,
      status: {
        in: [...FINAL_SESSION_STATUSES],
      },
      activity: {
        is: {
          type: ActivityType.game,
        },
      },
      OR: [
        {
          endedAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        {
          endedAt: null,
          startedAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      ],
    },
    include: {
      responses: {
        select: {
          reactionMs: true,
        },
      },
    },
  })

  if (!sessions.length) {
    await prisma.childActivityDailyStat.deleteMany({
      where: {
        childId,
        activityId,
        statDate: dayStart,
      },
    })
    return
  }

  const sessionsCount = sessions.length
  const completedSessions = sessions.filter((session) => session.status === SessionStatus.completed).length
  const abandonedSessions = sessions.filter((session) => session.status === SessionStatus.abandoned).length
  const totalResponses = sessions.reduce((sum, session) => sum + session.totalResponses, 0)
  const correctResponses = sessions.reduce((sum, session) => sum + session.correctResponses, 0)
  const wrongResponses = sessions.reduce((sum, session) => sum + session.wrongResponses, 0)
  const totalHelpUsed = sessions.reduce((sum, session) => sum + session.helpCount, 0)
  const totalAudioReplays = sessions.reduce((sum, session) => sum + session.audioReplayCount, 0)
  const reactionValues = sessions.flatMap((session) =>
    session.responses
      .map((response) => response.reactionMs)
      .filter((reactionMs): reactionMs is number => typeof reactionMs === 'number' && reactionMs > 0)
  )

  const accuracyRate = totalResponses > 0 ? correctResponses / totalResponses : null
  const completedRatio = completedSessions / Math.max(1, sessionsCount)
  const avgReactionMs =
    reactionValues.length > 0
      ? Math.round(reactionValues.reduce((sum, reactionMs) => sum + reactionMs, 0) / reactionValues.length)
      : null
  const engagementScore = roundMetric(
    clamp01(
      completedRatio * 0.45 +
        (accuracyRate ?? 0) * 0.35 +
        Math.max(0, 1 - totalHelpUsed / Math.max(totalResponses, 1)) * 0.2
    )
  )
  const preferenceScore = roundMetric(
    clamp01(
      completedRatio * 0.4 +
        Math.min(1, sessionsCount / 3) * 0.3 +
        (accuracyRate ?? 0) * 0.3
    )
  )

  await prisma.childActivityDailyStat.upsert({
    where: {
      childId_activityId_statDate: {
        childId,
        activityId,
        statDate: dayStart,
      },
    },
    update: {
      sessionsCount,
      completedSessions,
      abandonedSessions,
      totalResponses,
      correctResponses,
      wrongResponses,
      totalHelpUsed,
      totalAudioReplays,
      avgReactionMs,
      engagementScore,
      preferenceScore,
    },
    create: {
      childId,
      activityId,
      statDate: dayStart,
      sessionsCount,
      completedSessions,
      abandonedSessions,
      totalResponses,
      correctResponses,
      wrongResponses,
      totalHelpUsed,
      totalAudioReplays,
      avgReactionMs,
      engagementScore,
      preferenceScore,
    },
  })
}

async function syncChildSkillSnapshot(childId: number, skillId: number, snapshotDate: Date) {
  const dayStart = startOfDay(snapshotDate)
  const dayEnd = nextDay(dayStart)

  const sessions = await prisma.activitySession.findMany({
    where: {
      childId,
      status: {
        in: [...FINAL_SESSION_STATUSES],
      },
      activity: {
        is: {
          type: ActivityType.game,
          skills: {
            some: {
              skillId,
            },
          },
        },
      },
      OR: [
        {
          endedAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        {
          endedAt: null,
          startedAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      ],
    },
    include: {
      responses: {
        select: {
          reactionMs: true,
        },
      },
      activity: {
        select: {
          skills: {
            where: {
              skillId,
            },
            select: {
              weight: true,
            },
          },
        },
      },
    },
  })

  const attemptsCount = sessions.reduce((sum, session) => sum + session.totalResponses, 0)

  if (!sessions.length || attemptsCount === 0) {
    await prisma.childSkillSnapshot.deleteMany({
      where: {
        childId,
        skillId,
        snapshotDate: dayStart,
      },
    })
    return
  }

  const correctCount = sessions.reduce((sum, session) => sum + session.correctResponses, 0)
  const reactionValues = sessions.flatMap((session) =>
    session.responses
      .map((response) => response.reactionMs)
      .filter((reactionMs): reactionMs is number => typeof reactionMs === 'number' && reactionMs > 0)
  )
  const weightedSkillLoad = sessions.reduce((sum, session) => {
    const weight = session.activity.skills[0]?.weight ?? 1
    return sum + weight * Math.max(session.totalResponses, 1)
  }, 0)
  const accuracyRate = correctCount / attemptsCount
  const avgReactionMs =
    reactionValues.length > 0
      ? Math.round(reactionValues.reduce((sum, reactionMs) => sum + reactionMs, 0) / reactionValues.length)
      : null
  const averageWeight = weightedSkillLoad / attemptsCount
  const confidenceScore = roundMetric(
    clamp01(accuracyRate * 0.6 + Math.min(1, attemptsCount / 12) * 0.4)
  )
  const masteryScore = roundMetric(
    clamp01(
      accuracyRate * 0.7 +
        Math.min(1, attemptsCount / 18) * 0.15 +
        Math.min(1, averageWeight / 1.5) * 0.15
    )
  )

  await prisma.childSkillSnapshot.upsert({
    where: {
      childId_skillId_snapshotDate: {
        childId,
        skillId,
        snapshotDate: dayStart,
      },
    },
    update: {
      attemptsCount,
      correctCount,
      accuracyRate: roundMetric(accuracyRate),
      avgReactionMs,
      confidenceScore,
      masteryScore,
    },
    create: {
      childId,
      skillId,
      snapshotDate: dayStart,
      attemptsCount,
      correctCount,
      accuracyRate: roundMetric(accuracyRate),
      avgReactionMs,
      confidenceScore,
      masteryScore,
    },
  })
}

async function syncSessionProgressAggregates(sessionId: number) {
  const session = await prisma.activitySession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      childId: true,
      activityId: true,
      startedAt: true,
      endedAt: true,
      status: true,
      activity: {
        select: {
          type: true,
          skills: {
            select: {
              skillId: true,
            },
          },
        },
      },
    },
  })

  if (!session || session.activity.type !== ActivityType.game || session.status === SessionStatus.started) {
    return
  }

  const aggregateDate = session.endedAt ?? session.startedAt
  await syncChildActivityDailyStat(session.childId, session.activityId, aggregateDate)

  const skillIds = [...new Set(session.activity.skills.map((skillLink) => skillLink.skillId))]
  await Promise.all(skillIds.map((skillId) => syncChildSkillSnapshot(session.childId, skillId, aggregateDate)))
}

async function buildChildDashboard(childId: number) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      caregivers: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              role: true,
            },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      },
    },
  })

  if (!child) {
    const error = new Error('child_not_found')
    ;(error as Error & { status?: number }).status = 404
    throw error
  }

  const [recentSessions, dailyStats, skillSnapshots, recommendations] = await Promise.all([
    prisma.activitySession.findMany({
      where: {
        childId,
        activity: {
          is: {
            type: ActivityType.game,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        activity: {
          select: {
            code: true,
            name: true,
            type: true,
          },
        },
      },
    }),
    prisma.childActivityDailyStat.findMany({
      where: {
        childId,
        activity: {
          is: {
            type: ActivityType.game,
          },
        },
      },
      orderBy: [{ statDate: 'desc' }, { id: 'desc' }],
      take: 30,
      include: {
        activity: {
          select: {
            code: true,
            name: true,
            type: true,
          },
        },
      },
    }),
    prisma.childSkillSnapshot.findMany({
      where: {
        childId,
        skill: {
          is: {
            activities: {
              some: {
                activity: {
                  is: {
                    type: ActivityType.game,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ snapshotDate: 'desc' }, { id: 'desc' }],
      take: 12,
      include: {
        skill: {
          select: {
            code: true,
            name: true,
            category: true,
          },
        },
      },
    }),
    prisma.recommendation.findMany({
      where: {
        childId,
        status: RecommendationStatus.active,
        OR: [
          { activityId: null },
          {
            activity: {
              is: {
                type: ActivityType.game,
              },
            },
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      include: {
        activity: {
          select: {
            code: true,
            name: true,
            type: true,
          },
        },
      },
    }),
  ])

  const overview = dailyStats.reduce(
    (accumulator, stat) => {
      accumulator.totalSessions += stat.sessionsCount
      accumulator.totalResponses += stat.totalResponses
      accumulator.correctResponses += stat.correctResponses
      accumulator.activities[stat.activity.code] = {
        code: stat.activity.code,
        name: stat.activity.name,
        sessions: (accumulator.activities[stat.activity.code]?.sessions ?? 0) + stat.sessionsCount,
        preferenceScore:
          (accumulator.activities[stat.activity.code]?.preferenceScore ?? 0) +
          (stat.preferenceScore ?? 0),
      }
      return accumulator
    },
    {
      totalSessions: 0,
      totalResponses: 0,
      correctResponses: 0,
      activities: {} as Record<
        string,
        { code: string; name: string; sessions: number; preferenceScore: number }
      >,
    }
  )

  const favoriteActivity =
    Object.values(overview.activities).sort((left, right) => {
      const leftScore = left.preferenceScore + left.sessions
      const rightScore = right.preferenceScore + right.sessions
      return rightScore - leftScore
    })[0] ?? null

  return {
    child,
    overview: {
      totalSessions: overview.totalSessions,
      totalResponses: overview.totalResponses,
      accuracyRate:
        overview.totalResponses > 0
          ? Number((overview.correctResponses / overview.totalResponses).toFixed(2))
          : null,
      favoriteActivity,
    },
    dailyStats,
    skillSnapshots,
    recentSessions,
    recommendations,
  }
}

app.get('/health', async (_: Request, res: Response) => {
  const now: Array<{ now: Date }> = await prisma.$queryRaw`SELECT NOW() AS now`
  res.json({ ok: true, db: now?.[0]?.now ?? null })
})

app.post('/auth/register-child', async (req: Request, res: Response) => {
  const parsed = registerChildSchema.safeParse(req.body ?? {})

  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_register_payload',
      details: parsed.error.flatten(),
    })
  }

  const loginName = normalizeLoginName(parsed.data.name)

  if (!loginName) {
    return res.status(400).json({ error: 'name_invalid' })
  }

  const existingChild = await prisma.child.findUnique({
    where: { loginName },
    select: { id: true },
  })

  if (existingChild) {
    return res.status(409).json({ error: 'name_in_use' })
  }

  const child = await prisma.child.create({
    data: {
      name: parsed.data.name.trim(),
      loginName,
      gender: parsed.data.gender,
      birthdate: parsed.data.birthdate,
      passwordHash: hashPassword(parsed.data.password),
      adminPasswordHash: hashPassword(parsed.data.adminPassword),
      profile: {
        preferredLocale: 'es',
      },
      settings: {
        defaultDifficulty: 1,
      },
    },
    select: {
      id: true,
      name: true,
      loginName: true,
      gender: true,
      birthdate: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  setAuthSessionCookie(res, {
    childId: child.id,
    adminUnlocked: false,
  })

  return res.status(201).json({
    child,
    adminUnlocked: false,
  })
})

app.post('/auth/login-child', async (req: Request, res: Response) => {
  const parsed = loginChildSchema.safeParse(req.body ?? {})

  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_login_payload',
      details: parsed.error.flatten(),
    })
  }

  const loginName = normalizeLoginName(parsed.data.name)

  const child = await prisma.child.findUnique({
    where: { loginName },
    select: {
      id: true,
      name: true,
      loginName: true,
      gender: true,
      birthdate: true,
      passwordHash: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!child || !verifyPassword(parsed.data.password, child.passwordHash)) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  setAuthSessionCookie(res, {
    childId: child.id,
    adminUnlocked: false,
  })

  return res.json({
    child: {
      id: child.id,
      name: child.name,
      loginName: child.loginName,
      gender: child.gender,
      birthdate: child.birthdate,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
    },
    adminUnlocked: false,
  })
})

app.post('/auth/logout', (_: Request, res: Response) => {
  clearAuthSessionCookie(res)
  res.status(204).send()
})

app.get('/auth/me', async (req: Request, res: Response) => {
  const auth = await requireChildSession(req, res)

  if (!auth) {
    return
  }

  res.json({
    child: auth.child,
    adminUnlocked: auth.session.adminUnlocked,
  })
})

app.post('/auth/unlock-admin', async (req: Request, res: Response) => {
  const auth = await requireChildSession(req, res)

  if (!auth) {
    return
  }

  const parsed = unlockAdminSchema.safeParse(req.body ?? {})

  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_admin_payload',
      details: parsed.error.flatten(),
    })
  }

  const child = await prisma.child.findUnique({
    where: { id: auth.child.id },
    select: { id: true, adminPasswordHash: true },
  })

  if (!child || !verifyPassword(parsed.data.adminPassword, child.adminPasswordHash)) {
    return res.status(401).json({ error: 'invalid_admin_password' })
  }

  setAuthSessionCookie(res, {
    childId: auth.child.id,
    adminUnlocked: true,
  })

  res.json({
    child: auth.child,
    adminUnlocked: true,
  })
})

app.post('/auth/lock-admin', async (req: Request, res: Response) => {
  const auth = await requireChildSession(req, res)

  if (!auth) {
    return
  }

  setAuthSessionCookie(res, {
    childId: auth.child.id,
    adminUnlocked: false,
  })

  res.json({
    child: auth.child,
    adminUnlocked: false,
  })
})

app.patch('/auth/profile', async (req: Request, res: Response) => {
  const auth = await requireAdminSession(req, res)

  if (!auth) {
    return
  }

  const parsed = updateProfileSchema.safeParse(req.body ?? {})

  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_profile_payload',
      details: parsed.error.flatten(),
    })
  }

  const loginName = normalizeLoginName(parsed.data.name)

  if (!loginName) {
    return res.status(400).json({ error: 'name_invalid' })
  }

  const existingChild = await prisma.child.findUnique({
    where: { loginName },
    select: { id: true },
  })

  if (existingChild && existingChild.id !== auth.child.id) {
    return res.status(409).json({ error: 'name_in_use' })
  }

  const child = await prisma.child.update({
    where: { id: auth.child.id },
    data: {
      name: parsed.data.name.trim(),
      loginName,
      gender: parsed.data.gender,
      birthdate: parsed.data.birthdate,
    },
    select: {
      id: true,
      name: true,
      loginName: true,
      gender: true,
      birthdate: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  res.json({
    child,
    adminUnlocked: true,
  })
})

app.get('/auth/dashboard', async (req: Request, res: Response) => {
  const auth = await requireAdminSession(req, res)

  if (!auth) {
    return
  }

  const dashboard = await buildChildDashboard(auth.child.id)
  res.json(dashboard)
})

app.get('/children', async (req: Request, res: Response) => {
  const auth = await requireAdminSession(req, res)

  if (!auth) {
    return
  }

  const list = await prisma.child.findMany({
    where: {
      id: auth.child.id,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      caregivers: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              role: true,
            },
          },
        },
      },
      sessions: {
        where: {
          activity: {
            is: {
              type: ActivityType.game,
            },
          },
        },
        select: {
          id: true,
        },
      },
      recommendations: {
        where: {
          OR: [
            { activityId: null },
            {
              activity: {
                is: {
                  type: ActivityType.game,
                },
              },
            },
          ],
        },
        select: {
          id: true,
        },
      },
    },
  })

  res.json(
    list.map(({ sessions, recommendations, ...child }) => ({
      ...child,
      _count: {
        sessions: sessions.length,
        recommendations: recommendations.length,
      },
    }))
  )
})

app.post('/children', async (req: Request, res: Response) => {
  const auth = await requireAdminSession(req, res)

  if (!auth) {
    return
  }

  const parsed = childCreateSchema.safeParse(req.body ?? {})

  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_child_payload',
      details: parsed.error.flatten(),
    })
  }

  const defaultUserId = parsed.data.userId ?? 1
  const loginName = normalizeLoginName(parsed.data.loginName ?? parsed.data.name)

  if (!loginName) {
    return res.status(400).json({ error: 'name_invalid' })
  }

  const existingChild = await prisma.child.findUnique({
    where: { loginName },
    select: { id: true },
  })

  if (existingChild) {
    return res.status(409).json({ error: 'name_in_use' })
  }

  const caregivers = parsed.data.caregivers?.length
    ? parsed.data.caregivers
    : [
        {
          userId: defaultUserId,
          relationship: ChildCaregiverRole.parent,
          accessLevel: AccessLevel.owner,
          isPrimary: true,
        },
      ]

  const child = await prisma.child.create({
    data: {
      name: parsed.data.name,
      loginName,
      gender: parsed.data.gender,
      birthdate: parsed.data.birthdate ?? null,
      passwordHash: hashPassword(parsed.data.password),
      adminPasswordHash: hashPassword(parsed.data.adminPassword),
      profile: parsed.data.profile,
      settings: parsed.data.settings,
      caregivers: {
        create: caregivers.map((caregiver) => ({
          relationship: caregiver.relationship,
          accessLevel: caregiver.accessLevel,
          isPrimary: caregiver.isPrimary,
          user: {
            connect: {
              id: caregiver.userId,
            },
          },
        })),
      },
    },
    include: {
      caregivers: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              role: true,
            },
          },
        },
      },
    },
  })

  res.status(201).json(child)
})

app.get('/activities', async (_: Request, res: Response) => {
  const activities = await prisma.activity.findMany({
    where: { status: 'active' },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    include: {
      skills: {
        include: {
          skill: {
            select: {
              code: true,
              name: true,
              category: true,
            },
          },
        },
      },
    },
  })

  res.json(activities)
})

app.post('/sessions/start', async (req: Request, res: Response) => {
  const auth = await requireChildSession(req, res)

  if (!auth) {
    return
  }

  const parsed = sessionStartSchema.safeParse(req.body ?? {})

  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_session_payload',
      details: parsed.error.flatten(),
    })
  }

  const activity = await prisma.activity.findUnique({
    where: { code: parsed.data.activityCode },
    select: { id: true, code: true, name: true, type: true, status: true },
  })

  if (!activity || activity.status !== 'active') {
    return res.status(404).json({ error: 'activity_not_found' })
  }

  const session = await prisma.activitySession.create({
    data: {
      childId: auth.child.id,
      activityId: activity.id,
      locale: parsed.data.locale,
      difficultyStart: parsed.data.difficultyStart ?? null,
      deviceType: parsed.data.deviceType ?? null,
      metadata: parsed.data.metadata,
    },
    include: {
      activity: {
        select: {
          code: true,
          name: true,
          type: true,
        },
      },
    },
  })

  res.status(201).json(session)
})

app.post('/sessions/:sessionId/responses', async (req: Request, res: Response) => {
  const auth = await requireChildSession(req, res)

  if (!auth) {
    return
  }

  const sessionId = parseNumericParam(req.params.sessionId, 'session_id')
  const parsed = sessionResponsesSchema.safeParse(req.body ?? {})

  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_responses_payload',
      details: parsed.error.flatten(),
    })
  }

  const session = await prisma.activitySession.findUnique({
    where: { id: sessionId },
    select: { id: true, childId: true },
  })

  if (!session) {
    return res.status(404).json({ error: 'session_not_found' })
  }

  if (session.childId !== auth.child.id) {
    return res.status(403).json({ error: 'session_forbidden' })
  }

  const responses = await prisma.$transaction(
    parsed.data.responses.map((response) =>
      prisma.activityResponse.upsert({
        where: {
          sessionId_sequence: {
            sessionId,
            sequence: response.sequence,
          },
        },
        update: {
          promptType: response.promptType ?? null,
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
        },
        create: {
          sessionId,
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
        },
      })
    )
  )

  const updatedSession = await refreshSessionStats(sessionId)

  res.status(201).json({
    session: updatedSession,
    responses,
  })
})

app.post('/sessions/:sessionId/events/batch', async (req: Request, res: Response) => {
  const auth = await requireChildSession(req, res)

  if (!auth) {
    return
  }

  const sessionId = parseNumericParam(req.params.sessionId, 'session_id')
  const parsed = sessionEventsSchema.safeParse(req.body ?? {})

  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_events_payload',
      details: parsed.error.flatten(),
    })
  }

  const session = await prisma.activitySession.findUnique({
    where: { id: sessionId },
    select: { id: true, childId: true },
  })

  if (!session) {
    return res.status(404).json({ error: 'session_not_found' })
  }

  if (session.childId !== auth.child.id) {
    return res.status(403).json({ error: 'session_forbidden' })
  }

  await prisma.interactionEvent.createMany({
    data: parsed.data.events.map((event) => ({
      sessionId,
      responseId: event.responseId ?? null,
      type: event.type,
      occurredAt: event.occurredAt ?? new Date(),
      payload: event.payload,
    })),
  })

  const updatedSession = await refreshSessionStats(sessionId)

  res.status(201).json({
    ok: true,
    session: updatedSession,
    inserted: parsed.data.events.length,
  })
})

app.post('/sessions/:sessionId/finish', async (req: Request, res: Response) => {
  const auth = await requireChildSession(req, res)

  if (!auth) {
    return
  }

  const sessionId = parseNumericParam(req.params.sessionId, 'session_id')
  const parsed = sessionFinishSchema.safeParse(req.body ?? {})

  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_finish_payload',
      details: parsed.error.flatten(),
    })
  }

  const ownedSession = await prisma.activitySession.findUnique({
    where: { id: sessionId },
    select: { id: true, childId: true },
  })

  if (!ownedSession) {
    return res.status(404).json({ error: 'session_not_found' })
  }

  if (ownedSession.childId !== auth.child.id) {
    return res.status(403).json({ error: 'session_forbidden' })
  }

  const refreshedSession = await refreshSessionStats(sessionId)
  const endedAt = new Date()
  const durationMs = Math.max(0, endedAt.getTime() - refreshedSession.startedAt.getTime())
  const computedScore =
    refreshedSession.totalResponses > 0
      ? Number(
          ((refreshedSession.correctResponses / refreshedSession.totalResponses) * 100).toFixed(1)
        )
      : null

  const session = await prisma.activitySession.update({
    where: { id: sessionId },
    data: {
      status: parsed.data.status as SessionStatus,
      endedAt,
      durationMs,
      difficultyEnd: parsed.data.difficultyEnd ?? refreshedSession.difficultyEnd,
      completionRate:
        parsed.data.completionRate ??
        refreshedSession.completionRate ??
        (computedScore !== null ? Number((computedScore / 100).toFixed(2)) : null),
      score: parsed.data.score ?? computedScore,
      metadata: parsed.data.metadata ?? refreshedSession.metadata,
    },
    include: {
      activity: {
        select: {
          code: true,
          name: true,
          type: true,
        },
      },
    },
  })

  await syncSessionProgressAggregates(session.id)

  res.json(session)
})

app.get('/children/:childId/dashboard', async (req: Request, res: Response) => {
  const auth = await requireAdminSession(req, res)

  if (!auth) {
    return
  }

  const childId = parseNumericParam(req.params.childId, 'child_id')

  if (childId !== auth.child.id) {
    return res.status(403).json({ error: 'child_forbidden' })
  }

  const dashboard = await buildChildDashboard(childId)
  res.json(dashboard)
})

app.get('/progress/:childId', async (req: Request, res: Response) => {
  const auth = await requireAdminSession(req, res)

  if (!auth) {
    return
  }

  const childId = parseNumericParam(req.params.childId, 'child_id')

  if (childId !== auth.child.id) {
    return res.status(403).json({ error: 'child_forbidden' })
  }

  const stats = await prisma.childActivityDailyStat.findMany({
    where: {
      childId,
      activity: {
        is: {
          type: ActivityType.game,
        },
      },
    },
    orderBy: [{ statDate: 'desc' }, { id: 'desc' }],
    include: {
      activity: {
        select: {
          code: true,
          name: true,
          type: true,
        },
      },
    },
  })

  const byActivity = stats.reduce(
    (accumulator, stat) => {
      const current = accumulator[stat.activity.code] ?? {
        activityCode: stat.activity.code,
        activityName: stat.activity.name,
        type: stat.activity.type,
        sessionsCount: 0,
        totalResponses: 0,
        correctResponses: 0,
        wrongResponses: 0,
        avgReactionSamples: [] as number[],
      }

      current.sessionsCount += stat.sessionsCount
      current.totalResponses += stat.totalResponses
      current.correctResponses += stat.correctResponses
      current.wrongResponses += stat.wrongResponses

      if (typeof stat.avgReactionMs === 'number') {
        current.avgReactionSamples.push(stat.avgReactionMs)
      }

      accumulator[stat.activity.code] = current
      return accumulator
    },
    {} as Record<
      string,
      {
        activityCode: string
        activityName: string
        type: string
        sessionsCount: number
        totalResponses: number
        correctResponses: number
        wrongResponses: number
        avgReactionSamples: number[]
      }
    >
  )

  const rows = Object.values(byActivity).map((row) => ({
    activityCode: row.activityCode,
    activityName: row.activityName,
    type: row.type,
    sessionsCount: row.sessionsCount,
    correct: row.correctResponses,
    wrong: row.wrongResponses,
    accuracyRate:
      row.totalResponses > 0 ? Number((row.correctResponses / row.totalResponses).toFixed(2)) : null,
    avgMs:
      row.avgReactionSamples.length > 0
        ? Math.round(
            row.avgReactionSamples.reduce((total, value) => total + value, 0) /
              row.avgReactionSamples.length
          )
        : null,
  }))

  res.json(rows)
})

app.use((_: Request, res: Response) => {
  res.status(404).json({ error: 'not_found' })
})

app.use((err: Error & { status?: number }, _: Request, res: Response, __: NextFunction) => {
  const status = err.status || 500
  res.status(status).json({ error: err.message || 'internal_error' })
})

const port = Number(process.env.PORT || 8080)
app.listen(port, () => {
  console.log(`API running on :${port}`)
})
