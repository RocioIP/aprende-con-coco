export type ChildGender = 'boy' | 'girl'

export interface AuthChild {
  id: number
  name: string
  loginName: string
  gender: ChildGender
  birthdate: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AuthSessionResponse {
  child: AuthChild
  adminUnlocked: boolean
}

export interface RegisterChildPayload {
  name: string
  gender: ChildGender
  birthdate: string
  password: string
  adminPassword: string
}

export interface LoginChildPayload {
  name: string
  password: string
}

export interface UnlockAdminPayload {
  adminPassword: string
}

export interface UpdateProfilePayload {
  name: string
  gender: ChildGender
  birthdate: string
}
