import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

export async function createTestModule(providers: any[] = []): Promise<TestingModule> {
  return Test.createTestingModule({
    providers: [
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn((key: string, defaultValue?: any) => {
            const config = {
              NODE_ENV: 'test',
              PORT: 3000,
              DATABASE_HOST: 'localhost',
              DATABASE_PORT: 5432,
              DATABASE_USERNAME: 'test',
              DATABASE_PASSWORD: 'test',
              DATABASE_NAME: 'test_db',
              REDIS_HOST: 'localhost',
              REDIS_PORT: 6379,
              JWT_SECRET: 'test-secret',
              JWT_EXPIRES_IN: '1h',
              ANTHROPIC_API_KEY: 'test-key',
              OPENAI_API_KEY: 'test-key',
              GOOGLE_CLOUD_PROJECT_ID: 'test-project',
            };
            return config[key] || defaultValue;
          }),
        },
      },
      ...providers,
    ],
  }).compile();
}