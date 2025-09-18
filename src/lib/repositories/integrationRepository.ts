interface DatabaseIntegration {
  id: string;
  organization_id: string;
  provider: 'github';
  access_token: string;
  refresh_token?: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

interface CreateIntegrationData {
  id: string;
  organization_id: string;
  provider: 'github';
  access_token: string;
  refresh_token?: string;
  metadata: Record<string, unknown>;
}

interface UpdateIntegrationData {
  access_token?: string;
  refresh_token?: string;
  metadata?: Record<string, unknown>;
}

interface IIntegrationRepository {
  create(data: CreateIntegrationData): Promise<DatabaseIntegration>;
  findById(id: string): Promise<DatabaseIntegration | null>;
  findByOrganizationId(organizationId: string): Promise<DatabaseIntegration[]>;
  findLatestByProvider(provider: string): Promise<DatabaseIntegration | null>;
  update(id: string, data: UpdateIntegrationData): Promise<DatabaseIntegration>;
  delete(id: string): Promise<boolean>;
}
import { withDatabaseClient } from '../databaseUtils';
import { ApiErrorHandler } from '../apiUtils';

export class GitHubIntegrationRepository implements IIntegrationRepository {
  async create(integrationData: CreateIntegrationData): Promise<DatabaseIntegration> {
    return withDatabaseClient(async (databaseClient) => {
      const insertIntegrationQuery = `
        INSERT INTO integration_installations (
          id, organization_id, provider, access_token, refresh_token, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `;

      const insertValues = [
        integrationData.id,
        integrationData.organization_id,
        integrationData.provider,
        integrationData.access_token,
        integrationData.refresh_token || null,
        JSON.stringify(integrationData.metadata),
      ];

      const insertResult = await databaseClient.query(insertIntegrationQuery, insertValues);

      if (insertResult.rows.length === 0) {
        throw new ApiErrorHandler('Failed to create integration', 500, 'INTEGRATION_CREATE_FAILED');
      }

      return this.mapDatabaseRowToIntegration(insertResult.rows[0]);
    });
  }

  async findById(integrationId: string): Promise<DatabaseIntegration | null> {
    return withDatabaseClient(async (databaseClient) => {
      const selectQuery = 'SELECT * FROM integration_installations WHERE id = $1';
      const selectResult = await databaseClient.query(selectQuery, [integrationId]);

      return selectResult.rows.length > 0
        ? this.mapDatabaseRowToIntegration(selectResult.rows[0])
        : null;
    });
  }

  async findByOrganizationId(organizationId: string): Promise<DatabaseIntegration[]> {
    return withDatabaseClient(async (databaseClient) => {
      const selectQuery = `
        SELECT * FROM integration_installations
        WHERE organization_id = $1
        ORDER BY updated_at DESC
      `;
      const selectResult = await databaseClient.query(selectQuery, [organizationId]);

      return selectResult.rows.map(databaseRow => this.mapDatabaseRowToIntegration(databaseRow));
    });
  }

  async findLatestByProvider(providerName: string): Promise<DatabaseIntegration | null> {
    return withDatabaseClient(async (databaseClient) => {
      const selectQuery = `
        SELECT * FROM integration_installations
        WHERE provider = $1
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      const selectResult = await databaseClient.query(selectQuery, [providerName]);

      return selectResult.rows.length > 0
        ? this.mapDatabaseRowToIntegration(selectResult.rows[0])
        : null;
    });
  }

  async update(integrationId: string, updateData: UpdateIntegrationData): Promise<DatabaseIntegration> {
    return withDatabaseClient(async (databaseClient) => {
      const updateFields: string[] = [];
      const updateValues: unknown[] = [];
      let parameterIndex = 1;

      if (updateData.access_token !== undefined) {
        updateFields.push(`access_token = $${parameterIndex++}`);
        updateValues.push(updateData.access_token);
      }

      if (updateData.refresh_token !== undefined) {
        updateFields.push(`refresh_token = $${parameterIndex++}`);
        updateValues.push(updateData.refresh_token);
      }

      if (updateData.metadata !== undefined) {
        updateFields.push(`metadata = $${parameterIndex++}`);
        updateValues.push(JSON.stringify(updateData.metadata));
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(integrationId);

      const updateQuery = `
        UPDATE integration_installations
        SET ${updateFields.join(', ')}
        WHERE id = $${parameterIndex}
        RETURNING *
      `;

      const updateResult = await databaseClient.query(updateQuery, updateValues);

      if (updateResult.rows.length === 0) {
        throw new ApiErrorHandler('Integration not found for update', 404, 'INTEGRATION_NOT_FOUND');
      }

      return this.mapDatabaseRowToIntegration(updateResult.rows[0]);
    });
  }

  async delete(integrationId: string): Promise<boolean> {
    return withDatabaseClient(async (databaseClient) => {
      const deleteQuery = 'DELETE FROM integration_installations WHERE id = $1';
      const deleteResult = await databaseClient.query(deleteQuery, [integrationId]);

      return deleteResult.rowCount !== null && deleteResult.rowCount > 0;
    });
  }

  private mapDatabaseRowToIntegration(databaseRow: Record<string, unknown>): DatabaseIntegration {
    return {
      id: databaseRow.id as string,
      organization_id: databaseRow.organization_id as string,
      provider: databaseRow.provider as 'github',
      access_token: databaseRow.access_token as string,
      refresh_token: databaseRow.refresh_token as string | undefined,
      metadata: databaseRow.metadata as Record<string, unknown>,
      created_at: databaseRow.created_at as Date,
      updated_at: databaseRow.updated_at as Date,
    };
  }
}