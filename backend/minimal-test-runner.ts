import { Logger } from '@nestjs/common';
import { createMinimalTestApp } from './minimal-test-app';

async function runMinimalTests() {
  Logger.log('Starting minimal test backend...');
  try {
    const app = await createMinimalTestApp();
    Logger.log('Minimal test backend started successfully');
  } catch (error) {
    Logger.error('Failed to start minimal test backend:', error);
    process.exit(1);
  }
}

runMinimalTests();