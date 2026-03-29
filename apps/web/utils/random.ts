export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]]
  }

  return copy
}

export function sampleUnique<T>(items: readonly T[], total: number): T[] {
  const pool = [...items]
  const result: T[] = []
  const limit = Math.min(total, pool.length)

  for (let index = 0; index < limit; index += 1) {
    const randomIndex = Math.floor(Math.random() * pool.length)
    result.push(pool[randomIndex] as T)
    pool.splice(randomIndex, 1)
  }

  return result
}
