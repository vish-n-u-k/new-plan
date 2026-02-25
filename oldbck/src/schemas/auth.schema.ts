import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================
// Validation schemas for authentication flows
// ============================================

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerBuyerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  businessName: z.string().min(1).max(200),
  phone: z.string().min(10).max(15),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

// ============================================
// INFERRED TYPES
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterBuyerInput = z.infer<typeof registerBuyerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
