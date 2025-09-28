import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
    } catch (error) {
      console.error('Cache reset error:', error);
    }
  }

  /**
   * Get or set pattern - if key doesn't exist, execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      let value = await this.get<T>(key);
      
      if (value === null) {
        value = await fn();
        await this.set(key, value, ttl);
      }
      
      return value;
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error);
      // Fallback to function execution
      return await fn();
    }
  }

  /**
   * Cache product search results
   */
  async cacheProductSearch(query: string, results: any[], ttl = 300): Promise<void> {
    const key = `product_search:${this.hashQuery(query)}`;
    await this.set(key, results, ttl);
  }

  /**
   * Get cached product search results
   */
  async getCachedProductSearch(query: string): Promise<any[] | null> {
    const key = `product_search:${this.hashQuery(query)}`;
    return await this.get<any[]>(key);
  }

  /**
   * Cache price data
   */
  async cachePrices(productId: string, prices: any[], ttl = 600): Promise<void> {
    const key = `prices:${productId}`;
    await this.set(key, prices, ttl);
  }

  /**
   * Get cached price data
   */
  async getCachedPrices(productId: string): Promise<any[] | null> {
    const key = `prices:${productId}`;
    return await this.get<any[]>(key);
  }

  /**
   * Cache user session data
   */
  async cacheUserSession(userId: string, sessionData: any, ttl = 3600): Promise<void> {
    const key = `user_session:${userId}`;
    await this.set(key, sessionData, ttl);
  }

  /**
   * Get cached user session data
   */
  async getCachedUserSession(userId: string): Promise<any | null> {
    const key = `user_session:${userId}`;
    return await this.get<any>(key);
  }

  /**
   * Cache image recognition results
   */
  async cacheImageRecognition(imageHash: string, results: any[], ttl = 1800): Promise<void> {
    const key = `image_recognition:${imageHash}`;
    await this.set(key, results, ttl);
  }

  /**
   * Get cached image recognition results
   */
  async getCachedImageRecognition(imageHash: string): Promise<any[] | null> {
    const key = `image_recognition:${imageHash}`;
    return await this.get<any[]>(key);
  }

  /**
   * Cache retailer health status
   */
  async cacheRetailerHealth(retailerId: string, healthData: any, ttl = 300): Promise<void> {
    const key = `retailer_health:${retailerId}`;
    await this.set(key, healthData, ttl);
  }

  /**
   * Get cached retailer health status
   */
  async getCachedRetailerHealth(retailerId: string): Promise<any | null> {
    const key = `retailer_health:${retailerId}`;
    return await this.get<any>(key);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Note: This is a simplified implementation
      // In production, you might want to use Redis SCAN command
      const keys = await this.getKeysByPattern(pattern);
      for (const key of keys) {
        await this.del(key);
      }
    } catch (error) {
      console.error(`Cache invalidation error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      // This would require Redis-specific implementation
      // For now, return basic info
      return {
        status: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Hash query for cache key
   */
  private hashQuery(query: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get keys by pattern (simplified implementation)
   */
  private async getKeysByPattern(pattern: string): Promise<string[]> {
    // This is a placeholder - in production, use Redis SCAN
    return [];
  }
}