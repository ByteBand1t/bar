import { db } from "@/lib/db";
import { log } from "@/lib/logger";

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type WebPush = typeof import("web-push");

let configured = false;
let webPushPromise: Promise<WebPush> | null = null;

function getWebPush() {
  webPushPromise ??= (new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<WebPush>)("web-push");
  return webPushPromise;
}

function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL ?? "mailto:bar@franzi.app";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, email };
}

export async function sendPushToAll(title: string, body: string, data?: Record<string, unknown>) {
  const vapid = getVapidConfig();
  if (!vapid) {
    log.info("push_skipped", { reason: "missing_vapid_keys" });
    return;
  }

  const webPush = await getWebPush();
  if (!configured) {
    webPush.setVapidDetails(vapid.email, vapid.publicKey, vapid.privateKey);
    configured = true;
  }

  const subscriptions = await db.pushSubscription.findMany();
  const payload: PushPayload = { title, body, data };

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          { endpoint: subscription.endpoint, keys: subscription.keys as { p256dh: string; auth: string } },
          JSON.stringify(payload)
        );
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : undefined;
        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription.deleteMany({ where: { endpoint: subscription.endpoint } });
          return;
        }
        log.error("push_send_failed", { endpoint: subscription.endpoint, err: String(error) });
      }
    })
  );
}
