import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = express()

/* ---------- Seguridad / middlewares ---------- */
app.disable('x-powered-by')
app.set('trust proxy', 1) // útil en despliegues detrás de proxy

app.use(helmet())
app.use(express.json())

/* ---------- CORS ---------- */
const isDev = process.env.NODE_ENV !== 'production'

// Dominios permitidos en producción
const prodAllowlist = [
  'https://aprende-con-coco.vercel.app',
  process.env.CORS_ORIGIN, // por si usas un dominio propio
].filter(Boolean) as string[]

app.use(
  cors({
    origin: (origin, cb) => {
      // Peticiones sin origin (curl/Postman)
      if (!origin) return cb(null, true)

      // En desarrollo: permitir cualquier localhost/127.0.0.1 con cualquier puerto
      if (isDev && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return cb(null, true)
      }

      // Producción: vercel y dominio configurado
      if (prodAllowlist.includes(origin)) return cb(null, true)

      // También permitir previews de Vercel para este proyecto (opcional)
      if (/^https:\/\/aprende-con-coco(-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) {
        return cb(null, true)
      }

      return cb(new Error('Not allowed by CORS'))
    },
  })
)

/* ---------- Rutas ---------- */
app.get('/health', async (_: Request, res: Response) => {
  const now: any = await prisma.$queryRaw`SELECT NOW() AS now`
  res.json({ ok: true, db: now?.[0]?.now ?? null })
})

/** CHILDREN **/
app.get('/children', async (_: Request, res: Response) => {
  const list = await prisma.child.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(list)
})

app.post('/children', async (req: Request, res: Response) => {
  const { name, birthdate, userId = 1 } = req.body ?? {}
  if (!name) return res.status(400).json({ error: 'name_required' })

  const child = await prisma.child.create({
    data: {
      name,
      userId: Number(userId),
      birthdate: birthdate ? new Date(birthdate) : null,
    },
  })
  res.status(201).json(child)
})

/** ATTEMPTS **/
app.post('/attempts', async (req: Request, res: Response) => {
  const {
    child_id,
    game_code,
    level,
    target_color,
    target_size,
    target_letter,
    result,
    reaction_ms,
  } = req.body ?? {}

  if (!child_id || !game_code || typeof level !== 'number' || typeof result !== 'boolean') {
    return res.status(400).json({ error: 'missing_required_fields' })
  }

  await prisma.attempt.create({
    data: {
      childId: Number(child_id),
      gameCode: String(game_code),
      level: Number(level),
      targetColor: target_color ?? null,
      targetSize: target_size ?? null, // 'grande' | 'pequeno' | null
      targetLetter: target_letter ?? null,
      result: Boolean(result),
      reactionMs: reaction_ms ? Number(reaction_ms) : null,
    },
  })
  res.status(201).json({ ok: true })
})

/** PROGRESS **/
app.get('/progress/:childId', async (req: Request, res: Response) => {
  const childId = Number(req.params.childId)
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT gameCode as game_code, level,
            SUM(result = 1) AS correct,
            SUM(result = 0) AS wrong,
            AVG(reactionMs) AS avg_ms
       FROM Attempt
      WHERE childId = ?
      GROUP BY gameCode, level
      ORDER BY gameCode, level`,
    childId
  )
  res.json(rows)
})

/* ---------- 404 y errores ---------- */
app.use((_: Request, res: Response) => {
  res.status(404).json({ error: 'not_found' })
})

app.use((err: any, _: Request, res: Response, __: NextFunction) => {
  const status = err?.status || 500
  res.status(status).json({ error: err?.message || 'internal_error' })
})

/* ---------- Arranque ---------- */
const port = Number(process.env.PORT || 8080)
app.listen(port, () => console.log(`API running on :${port}`))
