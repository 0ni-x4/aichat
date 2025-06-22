import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : [],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test the connection and provide helpful error messages
prisma.$connect().catch((error: any) => {
  console.error('Failed to connect to database:', error.message)
  console.error('Make sure your DATABASE_URL is correct and the database is running')
}) 