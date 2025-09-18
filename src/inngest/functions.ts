import { inngest } from "@/lib/inngest";
import { GitHubIntegrationRepository } from "@/lib/repositories/integrationRepository";
import { GitHubWebhookEvent } from "@/lib/schemas";

const gitHubIntegrationRepository = new GitHubIntegrationRepository();

export const handleGitHubInstallationEvent = inngest.createFunction(
  { id: "handle-github-installation-event" },
  { event: "github/installation" },
  async ({ event }) => {
    const webhookEventData = event.data as GitHubWebhookEvent;
    const { action, installation } = webhookEventData;
    const installationId = installation.id.toString();

    switch (action) {
      case "created":
        return {
          success: true,
          action: "installation_created",
          message: "Installation created successfully"
        };

      case "deleted":
        const deletionSuccessful = await gitHubIntegrationRepository.delete(installationId);
        return {
          success: deletionSuccessful,
          action: "installation_deleted",
          message: deletionSuccessful ? "Installation deleted successfully" : "Failed to delete installation"
        };

      case "suspend":
      case "unsuspend":
        const existingIntegration = await gitHubIntegrationRepository.findById(installationId);

        if (existingIntegration) {
          const updatedMetadata = {
            ...existingIntegration.metadata,
            suspended: action === "suspend",
            suspension_timestamp: new Date().toISOString(),
          };

          await gitHubIntegrationRepository.update(installationId, {
            metadata: updatedMetadata
          });
        }

        return {
          success: true,
          action: `installation_${action}ed`,
          message: `Installation ${action}ed successfully`
        };

      default:
        return {
          success: true,
          action: "no_action_required",
          message: "Event received but no action was needed"
        };
    }
  }
);

export const handleGitHubInstallationRepositoriesEvent = inngest.createFunction(
  { id: "handle-github-installation-repositories-event" },
  { event: "github/installation_repositories" },
  async ({ event }) => {
    const webhookEventData = event.data as GitHubWebhookEvent;
    const { action, installation, repositories_added, repositories_removed } = webhookEventData;
    const installationId = installation.id.toString();

    const existingIntegration = await gitHubIntegrationRepository.findById(installationId);

    if (!existingIntegration) {
      return {
        success: false,
        error: "Installation not found in database",
        installation_id: installationId
      };
    }

    const repositoriesAddedCount = repositories_added?.length || 0;
    const repositoriesRemovedCount = repositories_removed?.length || 0;

    const updatedMetadata = {
      ...existingIntegration.metadata,
      repositories_added: repositories_added || [],
      repositories_removed: repositories_removed || [],
      last_repository_update: new Date().toISOString(),
      repository_change_summary: {
        added_count: repositoriesAddedCount,
        removed_count: repositoriesRemovedCount,
        action: action,
      }
    };

    await gitHubIntegrationRepository.update(installationId, {
      metadata: updatedMetadata
    });

    return {
      success: true,
      action: "repositories_updated",
      repositories_added_count: repositoriesAddedCount,
      repositories_removed_count: repositoriesRemovedCount,
      message: `Updated repository access: +${repositoriesAddedCount} -${repositoriesRemovedCount}`
    };
  }
);