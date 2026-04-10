import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import * as commentService from "../services/comment.service";

const router = Router();

router.get("/events/:eventId/comments", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const result = await commentService.getComments(req.params.eventId as string, page, limit);
  res.json(result);
});

router.post("/events/:eventId/comments", authenticate, validate(commentService.commentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const comment = await commentService.addComment(req.userId!, req.params.eventId as string, req.body.content);

    // Broadcast to event room
    const io = req.app.get("io");
    io?.to(`event:${req.params.eventId}`).emit("comment:new", comment);

    res.status(201).json(comment);
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return res.status(404).json({ error: "NOT_FOUND" });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.delete("/comments/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await commentService.deleteComment(req.params.id as string, req.userId!, req.userRole === "ADMIN");
    res.json({ success: true });
  } catch (err: any) {
    if (err.message === "FORBIDDEN") return res.status(403).json({ error: "FORBIDDEN" });
    if (err.message === "NOT_FOUND") return res.status(404).json({ error: "NOT_FOUND" });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

export default router;
