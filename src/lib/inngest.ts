import { Inngest } from "inngest";
import { envSchema } from "./schemas";

const environment = envSchema.parse(process.env);

export const inngest = new Inngest({
  id: "github-integration-app",
  name: "GitHub Integration App",
  eventKey: environment.INNGEST_EVENT_KEY,
});