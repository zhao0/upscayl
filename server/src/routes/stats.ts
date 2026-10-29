import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { getStats } from "../services/stats";

const router = Router();

/**
 * GET /api/stats
 * Returns cumulative processing stats
 */
router.get("/", (_req: Request, res: Response) => {
  try {
    res.json(getStats());
  } catch (error: any) {
    logger.error("Error reading stats:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
