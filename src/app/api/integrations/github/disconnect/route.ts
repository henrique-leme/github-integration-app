import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createGitHubIntegrationService } from '@/lib/services/githubIntegrationService';
import { decrypt } from '@/lib/encryption';
import { headers } from 'next/headers';

export async function POST(_request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT id, access_token FROM integration_installations
         WHERE provider = 'github'
         ORDER BY updated_at DESC
         LIMIT 1`
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'No GitHub integration found' }, { status: 404 });
      }

      const installation = result.rows[0];

      try {
        const decryptedToken = decrypt(installation.access_token);
        const githubService = createGitHubIntegrationService();
        await githubService.revokeInstallationAccessToken(decryptedToken);
      } catch (error) {
        console.error('Failed to revoke GitHub access token:', error);
      }

      await client.query(
        'DELETE FROM integration_installations WHERE id = $1',
        [installation.id]
      );

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error disconnecting GitHub:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}