import { prisma } from "../prisma/client";
import { z } from "zod";

export const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function addComment(userId: string, eventId: string, content: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("NOT_FOUND");

  return prisma.comment.create({
    data: { userId, eventId, content },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function deleteComment(commentId: string, userId: string, isAdmin: boolean) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("NOT_FOUND");
  if (comment.userId !== userId && !isAdmin) throw new Error("FORBIDDEN");

  return prisma.comment.delete({ where: { id: commentId } });
}

export async function getComments(eventId: string, page: number, limit: number) {
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { eventId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.comment.count({ where: { eventId } }),
  ]);
  return { comments, total, page, totalPages: Math.ceil(total / limit) };
}
