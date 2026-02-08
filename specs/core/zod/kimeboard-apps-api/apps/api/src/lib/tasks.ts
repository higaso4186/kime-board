import { CloudTasksClient } from "@google-cloud/tasks";
import { requireParam } from "./http";

const client = new CloudTasksClient();

export type TaskKind = "meeting_structurer" | "reply_integrator" | "draft_actions_skill";

const queue = requireParam(process.env.CLOUD_TASKS_QUEUE, "CLOUD_TASKS_QUEUE");
const location = process.env.CLOUD_TASKS_LOCATION || process.env.GCP_REGION || "asia-northeast1";
const project = requireParam(process.env.GOOGLE_CLOUD_PROJECT || process.env.FIRESTORE_PROJECT_ID, "GOOGLE_CLOUD_PROJECT");

const parent = client.queuePath(project, location, queue);

const getUrl = (kind: TaskKind): string => {
  if (kind === "meeting_structurer") return requireParam(process.env.AGENT_TASK_URL_MEETING, "AGENT_TASK_URL_MEETING");
  if (kind === "reply_integrator") return requireParam(process.env.AGENT_TASK_URL_REPLY, "AGENT_TASK_URL_REPLY");
  return requireParam(process.env.AGENT_TASK_URL_ACTIONS, "AGENT_TASK_URL_ACTIONS");
};

export const enqueueJsonTask = async (kind: TaskKind, payload: Record<string, any>, idempotencyKey?: string) => {
  const url = getUrl(kind);
  const serviceAccountEmail = requireParam(
    process.env.TASK_OIDC_SERVICE_ACCOUNT_EMAIL,
    "TASK_OIDC_SERVICE_ACCOUNT_EMAIL"
  );

  const body = Buffer.from(JSON.stringify({ ...payload, idempotencyKey }), "utf8").toString("base64");

  const task = {
    httpRequest: {
      httpMethod: "POST" as const,
      url,
      headers: { "Content-Type": "application/json" },
      body,
      oidcToken: {
        serviceAccountEmail,
        // audience is optional; if Agent uses Cloud Run auth, leaving it to url is acceptable.
        audience: url,
      },
    },
  };

  const [resp] = await client.createTask({ parent, task });
  return resp.name;
};
