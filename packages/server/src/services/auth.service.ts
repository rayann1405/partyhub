import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum"),
  name: z.string().min(2, "Nom : 2 caractères minimum").max(50),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function generateTokens(userId: string, role: string) {
  const access = jwt.sign({ sub: userId, role }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
  const refresh = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });
  return { access, refresh };
}

function sanitizeUser(user: { id: string; email: string; name: string; role: string; avatarUrl: string | null }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl };
}

export async function register(data: z.infer<typeof registerSchema>) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("EMAIL_TAKEN");

  const hash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: { email: data.email, password: hash, name: data.name },
  });

  const tokens = generateTokens(user.id, user.role);
  return { user: sanitizeUser(user), tokens };
}

export async function login(data: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error("INVALID_CREDENTIALS");

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  const tokens = generateTokens(user.id, user.role);
  return { user: sanitizeUser(user), tokens };
}

export async function refreshToken(token: string) {
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new Error("USER_NOT_FOUND");
    return generateTokens(user.id, user.role);
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true,
      _count: { select: { participations: true, votes: true, comments: true } },
    },
  });
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
}

export async function updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, role: true, avatarUrl: true },
  });
}
