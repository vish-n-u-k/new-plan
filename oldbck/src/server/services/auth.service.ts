import { randomBytes } from 'crypto';

import bcrypt from 'bcryptjs';

import { db } from '@/server/db';
import { AppError } from '@/server/errors';

import type { LoginInput, RegisterBuyerInput, ForgotPasswordInput, ResetPasswordInput, VerifyEmailInput } from '@/schemas';

// ============================================
// AUTH SERVICE
// ============================================
// Handles all authentication flows

const BCRYPT_SALT_ROUNDS = 12;
const SESSION_EXPIRY_DAYS = 30;
const PASSWORD_RESET_EXPIRY_HOURS = 1;
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

function stripPasswordHash<T extends { passwordHash: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _, ...rest } = user;
  return rest;
}

export const authService = {
  async registerBuyer(data: RegisterBuyerInput) {
    // 1. Check if a user with the given email already exists
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw AppError.conflict('A user with this email already exists');
    }

    // 2. Hash the password
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    // 3. Create the User record
    const user = await db.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        businessName: data.businessName,
        phone: data.phone,
        role: 'BUYER',
        emailVerified: false,
      },
    });

    // 4. Generate email verification token
    const verificationToken = generateToken();
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

    await db.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: verificationExpiry,
      },
    });

    // 5. TODO: Send verification email with the token link

    // 6. Create a new session
    const sessionToken = generateToken();
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + SESSION_EXPIRY_DAYS);

    const session = await db.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: sessionExpiry,
      },
    });

    return { user: stripPasswordHash(user), session };
  },

  async login(data: LoginInput) {
    // 1. Find user by email
    const user = await db.user.findUnique({ where: { email: data.email } });

    // 2. If not found, throw unauthorized (generic message to prevent email enumeration)
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // 3. If user is inactive, throw unauthorized
    if (!user.isActive) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // 4. Compare password
    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // 5. Create a new session
    const sessionToken = generateToken();
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + SESSION_EXPIRY_DAYS);

    const session = await db.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: sessionExpiry,
      },
    });

    return { user: stripPasswordHash(user), session };
  },

  async logout(sessionToken: string) {
    // Delete the session (idempotent — silently succeeds if not found)
    await db.session.deleteMany({ where: { token: sessionToken } });
  },

  async validateSession(sessionToken: string) {
    // 1. Find session by token, include user
    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    // 2. If not found, return null
    if (!session) {
      return null;
    }

    // 3. If expired, delete and return null
    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: session.id } });
      return null;
    }

    // 4. Return user without passwordHash
    return stripPasswordHash(session.user);
  },

  async verifyEmail(data: VerifyEmailInput) {
    // 1. Find the token
    const verificationToken = await db.emailVerificationToken.findUnique({
      where: { token: data.token },
      include: { user: true },
    });

    // 2. If not found, throw bad request
    if (!verificationToken) {
      throw AppError.badRequest('Invalid verification token');
    }

    // 3. If already used, throw bad request
    if (verificationToken.usedAt) {
      throw AppError.badRequest('This verification link has already been used');
    }

    // 4. If expired, throw bad request
    if (verificationToken.expiresAt < new Date()) {
      throw AppError.badRequest('This verification link has expired');
    }

    // 5. Update user emailVerified and mark token as used
    await db.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    await db.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    });
  },

  async forgotPassword(data: ForgotPasswordInput) {
    // 1. Find user by email
    const user = await db.user.findUnique({ where: { email: data.email } });

    // 2. If not found, silently succeed (prevent email enumeration)
    if (!user) {
      return;
    }

    // 3. Invalidate existing unused tokens
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // 4. Generate new token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // 5. TODO: Send password reset email with the token link
  },

  async resetPassword(data: ResetPasswordInput) {
    // 1. Find the token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: data.token },
      include: { user: true },
    });

    // 2. If not found, throw bad request
    if (!resetToken) {
      throw AppError.badRequest('Invalid reset token');
    }

    // 3. If already used, throw bad request
    if (resetToken.usedAt) {
      throw AppError.badRequest('This reset link has already been used');
    }

    // 4. If expired, throw bad request
    if (resetToken.expiresAt < new Date()) {
      throw AppError.badRequest('This reset link has expired. Please request a new one.');
    }

    // 5. Hash the new password
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    // 6. Update password, mark token as used, delete all sessions
    await db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    await db.session.deleteMany({
      where: { userId: resetToken.userId },
    });
  },

  async getCurrentUser(userId: string) {
    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw AppError.notFound('User');
    }

    return stripPasswordHash(user);
  },
};
