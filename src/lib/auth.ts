import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

interface UserWithRole {
  id: string
  role: string
  username: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          username: user.username,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as unknown as UserWithRole
        token.id = authUser.id
        token.role = authUser.role
        token.username = authUser.username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as UserWithRole).id = token.id as string
        (session.user as unknown as UserWithRole).role = token.role as string
        (session.user as unknown as UserWithRole).username = token.username as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  }
}
