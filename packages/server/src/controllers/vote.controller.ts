import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { voteLimiter } from "../middleware/rateLimiter";
import { castVote, getVoteResults } from "../services/vote.service";

const router = Router();

router.post("/:topicId", authenticate, voteLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { optionId } = req.body;
    if (!optionId) return res.status(400).json({ error: "OPTION_REQUIRED" });

    const io = req.app.get("io");
    const results = await castVote(req.userId!, req.params.topicId as string, optionId, io);
    res.json(results);
  } catch (err: any) {
    const statusMap: Record<string, number> = {
      TOPIC_NOT_FOUND: 404,
      VOTE_CLOSED: 403,
      INVALID_OPTION: 400,
    };
    const status = statusMap[err.message] || 500;
    res.status(status).json({ error: err.message });
  }
});

router.get("/:topicId/results", async (req, res) => {
  try {
    const results = await getVoteResults(req.params.topicId);
    res.json(results);
  } catch {
    res.status(404).json({ error: "TOPIC_NOT_FOUND" });
  }
});

export default router;
