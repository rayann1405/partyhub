import { Router, Request, Response } from "express";
import * as authService from "../services/auth.service";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authLimiter, validate(authService.registerSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.message === "EMAIL_TAKEN") return res.status(409).json({ error: "EMAIL_TAKEN" });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.post("/login", authLimiter, validate(authService.loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err: any) {
    if (err.message === "INVALID_CREDENTIALS") return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "NO_REFRESH_TOKEN" });
    const tokens = await authService.refreshToken(refreshToken);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: "INVALID_REFRESH_TOKEN" });
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await authService.getProfile(req.userId!);
    res.json(profile);
  } catch {
    res.status(404).json({ error: "USER_NOT_FOUND" });
  }
});

router.patch("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.updateProfile(req.userId!, req.body);
    res.json(user);
  } catch {
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

export default router;
