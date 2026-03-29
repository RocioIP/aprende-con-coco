declare module 'cors' {
  import type { RequestHandler } from 'express'

  export type CorsCallback = (err: Error | null, allow?: boolean) => void
  export type CorsOptionsDelegate<T> = (origin: string | undefined, callback: CorsCallback) => void

  interface CorsOptions {
    origin?: boolean | string | RegExp | Array<boolean | string | RegExp> | CorsOptionsDelegate<any>
  }

  const cors: (options?: CorsOptions) => RequestHandler

  export default cors
}
