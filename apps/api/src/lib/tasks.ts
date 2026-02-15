import { CloudTasksClient } from "@google-cloud/tasks";
import { requireParam } from "./http";
import runtimeDefaults from "@/data/config/runtime-defaults.json";

export type TaskKind = "meeting_structurer" | "reply_integrator" | "draft_actions_skill";

const disabled = process.env.DISABLE_CLOUD_TASKS === "true";

let client: CloudTasksClient | null = null;
const getClient = () => {
  if (!client) client = new CloudTasksClient();
  return client;
};

const getUrl = (kind: TaskKind): string => {
  if (kind === "meeting_structurer") return requireParam(process.env.AGENT_TASK_URL_MEETING, "AGENT_TASK_URL_MEETING");
  if (kind === "reply_integrator") return requireParam(process.env.AGENT_TASK_URL_REPLY, "AGENT_TASK_URL_REPLY");
  return requireParam(process.env.AGENT_TASK_URL_ACTIONS, "AGENT_TASK_URL_ACTIONS");
};

export const enqueueJsonTask = async (kind: TaskKind, payload: Record<string, unknown>, idempotencyKey?: string) => {
  if (disabled) {
    return `local-task-${kind}-${idempotencyKey ?? Date.now().toString()}`;
  }

  const queue = requireParam(process.env.CLOUD_TASKS_QUEUE, "CLOUD_TASKS_QUEUE");
  const location =
    process.env.CLOUD_TASKS_LOCATION ||
    process.env.GCP_REGION ||
    runtimeDefaults.cloudTasks.location;
  const project = requireParam(
    process.env.GOOGLE_CLOUD_PROJECT || process.env.FIRESTORE_PROJECT_ID,
    "GOOGLE_CLOUD_PROJECT"
  );
  const url = getUrl(kind);
  const audience = process.env.AGENT_TASK_OIDC_AUDIENCE || url;
  const serviceAccountEmail = requireParam(
    process.env.TASK_OIDC_SERVICE_ACCOUNT_EMAIL,
    "TASK_OIDC_SERVICE_ACCOUNT_EMAIL"
  );

  const body = Buffer.from(JSON.stringify({ ...payload, idempotencyKey }), "utf8").toString("base64");
  const tasksClient = getClient();
  const parent = tasksClient.queuePath(project, location, queue);

  const [resp] = await tasksClient.createTask({
    parent,
    task: {
      httpRequest: {
        httpMethod: "POST",
        url,
        headers: { "Content-Type": "application/json" },
        body,
        oidcToken: {
          serviceAccountEmail,
          audience,
        },
      },
    },
  });

  return resp.name ?? `${kind}:${Date.now()}`;
};
