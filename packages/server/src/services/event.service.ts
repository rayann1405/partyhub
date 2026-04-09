import { prisma } from "../prisma/client";
import { z } from "zod";
import { EventStatus } from "@prisma/client";

export const createEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(5000),
  date: z.string().datetime(),
  location: z.string().min(2).max(200),
  theme: z.string().max(100).optional(),
  imageUrls: z.array(z.string().url()).max(5).default([]),
  maxCapacity: z.number().int().positive().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
  voteTopics: z
    .array(
      z.object({
        category: z.enum(["BUDGET", "ENTRY_PRICE", "CUSTOM"]),
        label: z.string().min(3),
        closesAt: z.string().datetime(),
        options: z
          .array(z.object({ label: z.string(), value: z.number() }))
          .min(2)
          .max(10),
      })
    )
    .optional(),
});

export const updateEventSchema = createEventSchema.partial();

const eventInclude = {
  creator: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { participations: true, comments: true } },
};

const eventDetailInclude = {
  creator: { select: { id: true, name: true, avatarUrl: true } },
  participations: { select: { userId: true } },
  voteTopics: {
    include: {
      options: {
        include: { _count: { select: { votes: true } } },
      },
    },
  },
  comments: {
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" as const },
    take: 50,
  },
  _count: { select: { participations: true, comments: true } },
};

export async function listEvents(page: number, limit: number, status?: EventStatus) {
  const where = {
    status: status || "PUBLISHED",
    date: { gte: new Date() },
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { date: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: eventInclude,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total, page, totalPages: Math.ceil(total / limit) };
}

export async function listAllEvents(page: number, limit: number) {
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: eventInclude,
    }),
    prisma.event.count(),
  ]);
  return { events, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getEvent(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: eventDetailInclude,
  });
  if (!event) throw new Error("NOT_FOUND");
  return event;
}

export async function createEvent(creatorId: string, data: z.infer<typeof createEventSchema>) {
  return prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      location: data.location,
      theme: data.theme,
      imageUrls: data.imageUrls,
      maxCapacity: data.maxCapacity,
      status: data.status as EventStatus,
      creatorId,
      voteTopics: data.voteTopics
        ? {
            create: data.voteTopics.map((t) => ({
              category: t.category,
              label: t.label,
              closesAt: new Date(t.closesAt),
              options: { create: t.options },
            })),
          }
        : undefined,
    },
    include: eventDetailInclude,
  });
}

export async function updateEvent(id: string, data: z.infer<typeof updateEventSchema>) {
  const updateData: any = { ...data };
  if (data.date) updateData.date = new Date(data.date);
  delete updateData.voteTopics;

  return prisma.event.update({
    where: { id },
    data: updateData,
    include: eventDetailInclude,
  });
}

export async function deleteEvent(id: string) {
  return prisma.event.delete({ where: { id } });
}

export async function joinEvent(userId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { participations: true } } },
  });
  if (!event) throw new Error("NOT_FOUND");
  if (event.status !== "PUBLISHED") throw new Error("EVENT_NOT_AVAILABLE");
  if (event.maxCapacity && event._count.participations >= event.maxCapacity) {
    throw new Error("EVENT_FULL");
  }

  return prisma.participation.create({
    data: { userId, eventId },
  });
}

export async function leaveEvent(userId: string, eventId: string) {
  return prisma.participation.delete({
    where: { userId_eventId: { userId, eventId } },
  });
}
