import { Router, Request, Response } from "express";
import { createChallenge } from "altcha-lib";

const router = Router();

const HMAC_KEY = process.env.ALTCHA_HMAC_KEY || "upscayl-altcha-dev-key-change-in-prod";
const MAX_NUMBER = parseInt(process.env.ALTCHA_MAX_NUMBER || "50000", 10);

/**
 * GET /api/altcha/challenge
 * Generate a new ALTCHA proof-of-work challenge
 */
router.get("/challenge", async (_req: Request, res: Response) => {
  try {
    const challenge = await createChallenge({
      hmacKey: HMAC_KEY,
      maxNumber: MAX_NUMBER,
    });
    res.json(challenge);
  } catch (error: any) {
    console.error("Failed to create ALTCHA challenge:", error);
    res.status(500).json({ error: "Failed to create challenge" });
  }
});

export default router;
export { HMAC_KEY };
