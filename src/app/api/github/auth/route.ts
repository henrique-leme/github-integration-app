import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orgId = searchParams.get('org_id');

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  const githubUrl = new URL('https://github.com/apps/starsling-github-test-integration/installations/new');
  githubUrl.searchParams.set('state', orgId);

  return NextResponse.redirect(githubUrl.toString());
}