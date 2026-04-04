import { logger } from "./logger";

const BARK_KEY = process.env.BARK_KEY || "";
const BARK_SERVER = process.env.BARK_SERVER || "https://api.day.app";

/**
 * Send a push notification via Bark.
 * Requires BARK_KEY env variable to be set.
 * Optionally set BARK_SERVER if using a self-hosted Bark server.
 */
export async function sendBarkNotification(
  title: string,
  body: string
): Promise<void> {
  if (!BARK_KEY) {
    logger.log("⚠️ BARK_KEY not set, skipping notification");
    return;
  }

  const url = `${BARK_SERVER}/${BARK_KEY}/${encodeURIComponent(title)}/${encodeURIComponent(body)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      logger.error(`Bark notification failed: ${res.status} ${res.statusText}`);
    } else {
      logger.log(`📱 Bark notification sent: ${title}`);
    }
  } catch (err) {
    logger.error("Failed to send Bark notification:", err);
  }
}
