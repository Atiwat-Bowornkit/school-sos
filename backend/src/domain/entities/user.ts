export const USER_ROLES = ['responder'] as const
export type UserRole = (typeof USER_ROLES)[number]

export interface User {
  id: string
  username: string
  displayName: string
  passwordHash: string
  passwordSalt: string
  role: UserRole
  createdAt: string
}

export interface LoginInput {
  username: string
  password: string
}

export interface RegisterInput {
  username: string
  password: string
  displayName: string
  registrationKey: string
}
