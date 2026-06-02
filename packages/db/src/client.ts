import { PrismaClient } from '@prisma/client'

// Prevent multiple PrismaClient instances in Next.js dev hot-reload
declare global {
  var _prisma: PrismaClient | undefined
}

export const prisma: PrismaClient = globalThis._prisma ?? new PrismaClient()

if (process.env['NODE_ENV'] !== 'production') {
  globalThis._prisma = prisma
}
