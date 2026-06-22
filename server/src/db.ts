import { PrismaClient } from '@prisma/client';

class PrismaClientEnhanced extends PrismaClient {
  private maxRetries = 5;
  private retryDelay = 2000;

  async $connect() {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await super.$connect();
        console.log('Database connected successfully');
        return;
      } catch (err) {
        lastError = err as Error;
        console.log(`Database connection attempt ${attempt}/${this.maxRetries} failed:`, lastError.message);
        
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw new Error(`Failed to connect to database after ${this.maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  async reconnect() {
    console.log('Attempting to reconnect to database...');
    try {
      await this.$disconnect();
      await this.$connect();
      console.log('Reconnected to database');
      return true;
    } catch (err) {
      console.error('Failed to reconnect to database:', err);
      return false;
    }
  }
}

export const prisma = new PrismaClientEnhanced({
  log: [
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});
