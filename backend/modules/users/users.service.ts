import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive?: boolean;
  isVerified?: boolean;
  preferences?: any;
  metadata?: any;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  preferences?: any;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = this.userRepository.create(createUserDto);
      const savedUser = await this.userRepository.save(user);
      
      this.logger.log(`User created: ${savedUser.email}`);
      return savedUser;
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to find user by ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch (error) {
      this.logger.error(`Failed to find user by email ${email}:`, error);
      return null;
    }
  }

  /**
   * Update user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      Object.assign(user, updateUserDto);
      const updatedUser = await this.userRepository.save(user);
      
      this.logger.log(`User updated: ${updatedUser.email}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    try {
      await this.userRepository.update(id, { password: hashedPassword });
      this.logger.log(`Password updated for user: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to update password for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      const user = await this.findById(id);
      if (user) {
        const metadata = (user.metadata || {}) as any;
        metadata.lastLoginAt = new Date();
        metadata.loginCount = (metadata.loginCount || 0) + 1;
        
        await this.userRepository.update(id, { metadata });
      }
    } catch (error) {
      this.logger.error(`Failed to update last login for user ${id}:`, error);
    }
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken(id: string, token: string): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now
      
      await this.userRepository.update(id, {
        resetPasswordToken: token,
        resetPasswordExpires: expiresAt,
      });
      
      this.logger.log(`Password reset token set for user: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to set password reset token for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Clear password reset token
   */
  async clearPasswordResetToken(id: string): Promise<void> {
    try {
      await this.userRepository.update(id, {
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
      
      this.logger.log(`Password reset token cleared for user: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to clear password reset token for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      await this.userRepository.remove(user);
      this.logger.log(`User deleted: ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  async findAll(page = 1, limit = 20): Promise<{ users: User[]; total: number }> {
    try {
      const [users, total] = await this.userRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return { users, total };
    } catch (error) {
      this.logger.error('Failed to find all users:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<any> {
    try {
      const totalUsers = await this.userRepository.count();
      const activeUsers = await this.userRepository.count({ where: { isActive: true } });
      const verifiedUsers = await this.userRepository.count({ where: { isVerified: true } });

      return {
        totalUsers,
        activeUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        inactiveUsers: totalUsers - activeUsers,
      };
    } catch (error) {
      this.logger.error('Failed to get user stats:', error);
      return null;
    }
  }
}