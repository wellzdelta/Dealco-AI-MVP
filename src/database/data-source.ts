import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USERNAME', 'dealco_user'),
  password: configService.get<string>('DATABASE_PASSWORD', 'dealco_password'),
  database: configService.get<string>('DATABASE_NAME', 'dealco_ai'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  ssl: configService.get<string>('NODE_ENV') === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});