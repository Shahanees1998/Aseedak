import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          throw new Error("Email and password are required")
        }

        try {
          console.log('🔍 Looking for user:', credentials.email)
          
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          console.log('👤 User found:', user ? 'Yes' : 'No')
          
          if (user) {
            console.log('📋 User details:', {
              id: user.id,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              emailVerified: user.emailVerified
            })
          }

          // Always perform password verification to prevent timing attacks
          const dummyHash = '$2a$10$dummy.hash.to.prevent.timing.attacks'
          const hashToCompare = user?.password || dummyHash
          const isPasswordValid = await bcrypt.compare(credentials.password, hashToCompare)

          console.log('🔑 Password valid:', isPasswordValid)

          // If user doesn't exist, return null
          if (!user) {
            console.log('❌ User not found, returning null')
            return null
          }

          // If password is invalid, return null
          if (!isPasswordValid) {
            console.log('❌ Invalid password, returning null')
            return null
          }

          // Check if email is verified
          if (!user.emailVerified) {
            console.log('❌ Email not verified')
            throw new Error("Email not verified")
          }

          // Check if account is active
          if (!user.isActive) {
            console.log('❌ Account inactive')
            throw new Error("Account is inactive")
          }

          // Check if user is admin (only allow admin users to login via NextAuth)
          if (user.role !== 'ADMIN') {
            console.log('❌ User is not admin, role:', user.role)
            throw new Error("Access denied. Admin privileges required.")
          }

          console.log('✅ Authorization successful for:', user.email)

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username || '',
            role: user.role,
            avatar: user.avatar || '',
            profileImage: user.profileImageUrl || ''
          } as any
        } catch (error) {
          console.error("❌ Authorization error:", error)
          throw error
        } finally {
          await prisma.$disconnect()
        }
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.username = user.username
        token.avatar = user.avatar
        token.profileImage = user.profileImage
      }

      // Handle session update
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

      return token
    },

    async session({ session, token }) {
      // Add user info to session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.role = token.role as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.username = token.username as string
        session.user.avatar = token.avatar as string
        session.user.profileImage = token.profileImage as string
      }

      return session
    }
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,
  
  debug: process.env.NODE_ENV === 'development',
}

