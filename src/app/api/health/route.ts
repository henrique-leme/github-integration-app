import { NextResponse } from 'next/server';
import { envSchema } from '@/lib/schemas';

export async function GET() {
  try {
    envSchema.parse(process.env);

    return NextResponse.json({ status: 'ok', message: 'Environment is valid' });
  } catch (error) {
    console.error('Environment validation failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Environment validation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}