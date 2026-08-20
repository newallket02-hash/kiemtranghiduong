import { NextResponse } from 'next/server';
import { getBootstrap } from '@/lib/backend';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const data = await getBootstrap();
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
