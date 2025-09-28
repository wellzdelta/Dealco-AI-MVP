import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { join } from 'path';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get<string>('DATABASE_HOST', 'localhost'),
      port: this.configService.get<number>('DATABASE_PORT', 5432),
      username: this.configService.get<string>('DATABASE_USERNAME', 'dealco_user'),
      password: this.configService.get<string>('DATABASE_PASSWORD', 'dealco_password'),
      database: this.configService.get<string>('DATABASE_NAME', 'dealco_ai'),
      entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
      migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
      synchronize: this.configService.get<string>('NODE_ENV') === 'development',
      logging: this.configService.get<string>('NODE_ENV') === 'development',
      ssl: this.configService.get<string>('NODE_ENV') === 'production' ? {
        rejectUnauthorized: false,
      } : false,
      extra: {
        max: 20, // Maximum number of connections
        min: 5,  // Minimum number of connections
        acquire: 30000, // Maximum time to wait for a connection
        idle: 10000, // Maximum time a connection can be idle
      },
      cache: {
        type: 'redis',
        options: {
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
          password: this.configService.get<string>('REDIS_PASSWORD'),
        },
        duration: 30000, // 30 seconds
      },
    };
  }
}