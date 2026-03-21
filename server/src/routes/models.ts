import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { listModels } from "../services/upscale-service";

const router = Router();

/**
 * GET /api/models
 * Returns the list of available upscaling models
 */
router.get("/", (_req: Request, res: Response) => {
  try {
    const models = listModels();
    res.json({ models });
  } catch (error: any) {
    logger.error("Error listing models:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
