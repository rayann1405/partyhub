import { prisma } from "../prisma/client";
import { Server as IOServer } from "socket.io";

export async function castVote(userId: string, topicId: string, optionId: string, io: IOServer) {
  const topic = await prisma.voteTopic.findUnique({
    where: { id: topicId },
    include: { options: true },
  });

  if (!topic) throw new Error("TOPIC_NOT_FOUND");
  if (new Date() > topic.closesAt) throw new Error("VOTE_CLOSED");
  if (!topic.options.some((o) => o.id === optionId)) throw new Error("INVALID_OPTION");

  // Check existing vote on this topic (not just this option)
  const existingVote = await prisma.vote.findFirst({
    where: { userId, option: { topicId } },
  });

  if (existingVote) {
    if (existingVote.optionId === optionId) {
      // Same option — remove vote (toggle)
      await prisma.vote.delete({ where: { id: existingVote.id } });
    } else {
      // Different option — change vote
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { optionId },
      });
    }
  } else {
    await prisma.vote.create({ data: { userId, optionId } });
  }

  const results = await getVoteResults(topicId);

  // Broadcast live
  io.to(`event:${topic.eventId}`).emit("vote:update", { topicId, results });

  return results;
}

export async function getVoteResults(topicId: string) {
  const options = await prisma.voteOption.findMany({
    where: { topicId },
    include: { _count: { select: { votes: true } } },
    orderBy: { value: "asc" },
  });

  const total = options.reduce((sum, o) => sum + o._count.votes, 0);

  return options.map((o) => ({
    id: o.id,
    label: o.label,
    value: o.value,
    count: o._count.votes,
    percentage: total > 0 ? Math.round((o._count.votes / total) * 100) : 0,
  }));
}

export async function getUserVotes(userId: string, topicIds: string[]) {
  const votes = await prisma.vote.findMany({
    where: { userId, option: { topicId: { in: topicIds } } },
    include: { option: { select: { topicId: true } } },
  });

  const map: Record<string, string> = {};
  for (const v of votes) {
    map[v.option.topicId] = v.optionId;
  }
  return map;
}
