import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = express()

const allowlist = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CORS_ORIGIN // p.ej. https://aprende-con-coco.vercel.app
].filter(Boolean) as string[]

app.use(helmet())
app.use(express.json())
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowlist.includes(origin)) return cb(null, true)
    return cb(new Error('Not allowed by CORS'))
  }
}))

app.get('/health', async (_, res) => {
  const now: any = await prisma.$queryRaw`SELECT NOW() AS now`
  res.json({ ok: true, db: now?.[0]?.now ?? null })
})

/** CHILDREN **/
app.get('/children', async (req, res) => {
  // de momento sin auth: trae todos para probar (luego filtraremos por user)
  const list = await prisma.child.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(list)
})

app.post('/children', async (req, res) => {
  const { name, birthdate, userId = 1 } = req.body ?? {}
  if (!name) return res.status(400).json({ error: 'name_required' })
  const child = await prisma.child.create({
    data: {
      name,
      userId: Number(userId),
      birthdate: birthdate ? new Date(birthdate) : null
    }
  })
  res.status(201).json(child)
})

/** ATTEMPTS **/
app.post('/attempts', async (req, res) => {
  const {
    child_id, game_code, level,
    target_color, target_size, target_letter,
    result, reaction_ms
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
      targetSize: target_size ?? null,      // 'grande' | 'pequeno' | null
      targetLetter: target_letter ?? null,
      result: Boolean(result),
      reactionMs: reaction_ms ? Number(reaction_ms) : null
    }
  })
  res.status(201).json({ ok: true })
})

/** PROGRESS **/
app.get('/progress/:childId', async (req, res) => {
  const childId = Number(req.params.childId)
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT gameCode as game_code, level,
            SUM(result = 1) AS correct,
            SUM(result = 0) AS wrong,
            AVG(reactionMs) AS avg_ms
       FROM Attempt
      WHERE childId = ?
      GROUP BY gameCode, level
      ORDER BY gameCode, level`, childId
  )
  res.json(rows)
})

const port = Number(process.env.PORT || 8080)
app.listen(port, () => console.log(`API running on :${port}`))
