import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    BACKEND_URL: process.env.BACKEND_URL || 'NOT_CONFIGURED',
    MYSQL_PROXY_URL: process.env.MYSQL_PROXY_URL || 'NOT_CONFIGURED',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL || 'false',
    VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_SET'
  });
}
