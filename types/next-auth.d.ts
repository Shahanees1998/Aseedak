import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      username: string
      avatar: string | null
      role: string
      profileImageUrl?: string
    }
  }

  interface User {
    username: string
    avatar: string | null
    role: string
    profileImageUrl?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username: string
    avatar: string | null
    role: string
  }
}