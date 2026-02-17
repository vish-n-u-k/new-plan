import { db } from '@/server/db';

import type { CreateUser, UpdateUser } from '@/schemas';

// ============================================
// USER SERVICE
// ============================================
// Business logic layer - sits between routes and database
// Keeps routes thin and logic reusable
// Framework-agnostic (works with REST, tRPC, GraphQL, etc.)

export const userService = {
  async findById(id: string) {
    return db.user.findUnique({
      where: { id },
    });
  },

  async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
    });
  },

  async findMany(params: { limit?: number; offset?: number } = {}) {
    const { limit = 20, offset = 0 } = params;

    return db.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  },

  async count(where?: { role?: 'SELLER' | 'BUYER' }) {
    return db.user.count({ where });
  },

  async create(data: CreateUser) {
    return db.user.create({
      data,
    });
  },

  async update(id: string, data: UpdateUser) {
    return db.user.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return db.user.delete({
      where: { id },
    });
  },

  async exists(id: string): Promise<boolean> {
    const count = await db.user.count({
      where: { id },
    });
    return count > 0;
  },
};
