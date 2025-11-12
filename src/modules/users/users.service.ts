import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { User, UserStatus } from '../../types/database.types';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User> {
  const user = await this.db.queryOne<User>(
    `SELECT * FROM users WHERE id = $1 AND status != $2`,
    [id, UserStatus.DELETED]
  );

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}

  /**
   * Find user by phone
   */
 async findByPhone(phone: string): Promise<User | null> {
  return await this.db.queryOne<User>(
    `SELECT * FROM users WHERE phone = $1 AND status != $2`,
    [phone, UserStatus.DELETED]
  );
}

  /**
   * Update user profile
   */
  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
  const { name, email, profile_photo_url } = updateUserDto;

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
  }

  if (email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    values.push(email);
  }

  if (profile_photo_url !== undefined) {
    updates.push(`profile_photo_url = $${paramIndex++}`);
    values.push(profile_photo_url);
  }

  if (updates.length === 0) {
    return await this.findById(userId);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const query = `
    UPDATE users 
    SET ${updates.join(', ')} 
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const user = await this.db.queryOne<User>(query, values);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}


  /**
   * Delete user (soft delete)
   */
  async delete(userId: string): Promise<void> {
    await this.db.query(
      `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [UserStatus.DELETED, userId]
    );
  }

  /**
   * Get all users (admin only)
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    role?: string,
  ): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;

    let whereClause = `WHERE status != $1`;
    const params: any[] = [UserStatus.DELETED];

    if (role) {
      whereClause += ` AND role = $${params.length + 1}`;
      params.push(role);
    }

    // Get total count
    const countResult = await this.db.queryOne(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      params
    );
    const total = countResult && countResult.rows.length > 0 ? parseInt(countResult.rows[0].count) : 0;

    // Get users
    const result = await this.db.queryMany(
      `SELECT * FROM users 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const users = (result || []) as User[];

    return {
      users,
      total,
      page,
      limit,
    };
  }
}
