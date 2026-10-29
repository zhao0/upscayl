import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

/** Persistent stats are stored as a small JSON file on disk */
const dataDir = path.resolve(__dirname, "../../data");
const statsPath = path.join(dataDir, "stats.json");

export interface Stats {
  /** Cumulative number of successfully upscaled images since first launch */
  totalProcessed: number;
  updatedAt: string;
}

let stats: Stats = { totalProcessed: 0, updatedAt: new Date(0).toISOString() };

function load(): void {
  try {
    if (!fs.existsSync(statsPath)) return;
    const parsed = JSON.parse(fs.readFileSync(statsPath, "utf-8"));
    const total = Number(parsed?.totalProcessed);
    if (Number.isFinite(total) && total >= 0) {
      stats = {
        totalProcessed: Math.floor(total),
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
      logger.log(`📊 Loaded stats: ${stats.totalProcessed} images processed`);
    }
  } catch (err) {
    logger.error(`Failed to read stats file: ${statsPath}`, err);
  }
}

/** Write via temp file + rename so a crash mid-write can't corrupt the counter */
function persist(): void {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const tmpPath = `${statsPath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(stats, null, 2));
    fs.renameSync(tmpPath, statsPath);
  } catch (err) {
    logger.error(`Failed to write stats file: ${statsPath}`, err);
  }
}

load();

export function getStats(): Stats {
  return { ...stats };
}

/** Count one more finished image and flush to disk */
export function incrementProcessed(): Stats {
  stats = {
    totalProcessed: stats.totalProcessed + 1,
    updatedAt: new Date().toISOString(),
  };
  persist();
  return getStats();
}
