import { z } from 'zod';

// ============================================
// USER SCHEMAS
// ============================================
// Must align with prisma/schema.prisma User model
// ============================================

// Enum matching Prisma Role enum
export const roleSchema = z.enum(['SELLER', 'BUYER']);
export type Role = z.infer<typeof roleSchema>;

// Base user schema (matches Prisma model, excludes passwordHash)
export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  businessName: z.string().min(1).max(200),
  phone: z.string().min(10).max(15),
  role: roleSchema,
  emailVerified: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// For API responses (dates as strings for JSON)
export const userResponseSchema = userSchema.extend({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// For creating a user (no id, timestamps auto-generated)
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100),
  businessName: z.string().min(1).max(200),
  phone: z.string().min(10).max(15),
  role: roleSchema.optional(),
});

// For updating a user (all fields optional)
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1).max(100).optional(),
  businessName: z.string().min(1).max(200).optional(),
  phone: z.string().min(10).max(15).optional(),
  role: roleSchema.optional(),
});

// For queries by ID
export const userIdSchema = z.object({
  id: z.string().cuid('Invalid user ID'),
});

// For queries by email
export const userEmailSchema = z.object({
  email: z.string().email(),
});

// ============================================
// INFERRED TYPES
// ============================================

export type User = z.infer<typeof userSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserId = z.infer<typeof userIdSchema>;
