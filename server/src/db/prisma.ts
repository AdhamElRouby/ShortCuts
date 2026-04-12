/**
 * Prisma Database Client
 * Initializes and exports the Prisma ORM client with PostgreSQL adapter
 * Handles all database interactions throughout the application
 */

import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";

// Create PostgreSQL adapter for Prisma with database URL from environment
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

// Initialize Prisma client with logging enabled for debugging
export const prisma = new PrismaClient({ adapter, log: ['query', 'info', 'warn', 'error'] })
