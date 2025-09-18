import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import {
  handleGitHubInstallationEvent,
  handleGitHubInstallationRepositoriesEvent
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    handleGitHubInstallationEvent,
    handleGitHubInstallationRepositoriesEvent,
  ],
});