import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: string
      firstName: string
      lastName: string
      username: string
      avatar: string
      profileImage: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    email: string
    role: string
    firstName: string
    lastName: string
    username: string
    avatar: string
    profileImage: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    email: string
    role: string
    firstName: string
    lastName: string
    username: string
    avatar: string
    profileImage: string
  }
}

