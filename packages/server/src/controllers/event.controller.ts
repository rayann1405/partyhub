import { Router, Request, Response } from "express";
import { authenticate, requireAdmin, AuthRequest, optionalAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import * as eventService from "../services/event.service";
import { getUserVotes } from "../services/vote.service";

const router = Router();

// GET /events — public, paginated
router.get("/", async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const result = await eventService.listEvents(page, limit);
  res.json(result);
});

// GET /events/admin — all events for admin
router.get("/admin", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const result = await eventService.listAllEvents(page, limit);
  res.json(result);
});

// GET /events/:id — detail
router.get("/:id", optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const event = await eventService.getEvent(req.params.id as string);

    // If user is logged in, include their votes for this event
    let userVotes: Record<string, string> = {};
    if (req.userId && event.voteTopics.length > 0) {
      const topicIds = event.voteTopics.map((t) => t.id);
      userVotes = await getUserVotes(req.userId, topicIds);
    }

    res.json({ ...event, userVotes });
  } catch {
    res.status(404).json({ error: "NOT_FOUND" });
  }
});

// POST /events — admin only
router.post("/", authenticate, requireAdmin, validate(eventService.createEventSchema), async (req: AuthRequest, res: Response) => {
  try {
    const event = await eventService.createEvent(req.userId!, req.body);
    req.app.get("io")?.emit("event:new", { id: event.id, title: event.title, date: event.date });
    res.status(201).json(event);
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /events/:id — admin only
router.put("/:id", authenticate, requireAdmin, validate(eventService.updateEventSchema), async (req: AuthRequest, res: Response) => {
  try {
    const event = await eventService.updateEvent(req.params.id as string, req.body);
    res.json(event);
  } catch {
    res.status(404).json({ error: "NOT_FOUND" });
  }
});

// DELETE /events/:id — admin only
router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await eventService.deleteEvent(req.params.id as string);
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "NOT_FOUND" });
  }
});

// POST /events/:id/join
router.post("/:id/join", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await eventService.joinEvent(req.userId!, req.params.id as string);
    res.json({ success: true });
  } catch (err: any) {
    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      EVENT_NOT_AVAILABLE: 400,
      EVENT_FULL: 409,
    };
    const status = statusMap[err.message] || 500;
    res.status(status).json({ error: err.message });
  }
});

// DELETE /events/:id/leave
router.delete("/:id/leave", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await eventService.leaveEvent(req.userId!, req.params.id as string);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "NOT_PARTICIPATING" });
  }
});

export default router;
