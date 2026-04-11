import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminPassword = await bcrypt.hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@partyhub.com" },
    update: {},
    create: {
      email: "admin@partyhub.com",
      password: adminPassword,
      name: "Admin PartyHub",
      role: "ADMIN",
    },
  });

  // Test users
  const userPassword = await bcrypt.hash("user123456", 12);
  const users = await Promise.all(
    ["Alice Dupont", "Bob Martin", "Clara Ndiaye", "David Osei", "Emma Traoré"].map((name) =>
      prisma.user.upsert({
        where: { email: `${name.split(" ")[0].toLowerCase()}@test.com` },
        update: {},
        create: {
          email: `${name.split(" ")[0].toLowerCase()}@test.com`,
          password: userPassword,
          name,
        },
      })
    )
  );

  // Réinitialiser les événements de démo (votes d’abord à cause des FK)
  await prisma.vote.deleteMany();
  await prisma.event.deleteMany();

  // Events — images : URLs Unsplash stables (photo ID + crop) alignées sur chaque thème
  const now = new Date();
  const events = [
    {
      title: "Nuit Néon 💡",
      description:
        "Soirée fluo géante au campus ! Ramène ta meilleure tenue blanche, on fournit les bracelets UV. DJ set live, bar à cocktails et photobooth néon.",
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      location: "Hall B — Campus Epitech",
      theme: "Néon / Fluo",
      imageUrls: [
        "https://images.unsplash.com/photo-1470225620780-dba8ba362b72?auto=format&fit=crop&w=1600&q=85",
      ],
      maxCapacity: 200,
    },
    {
      title: "Soirée Masquée 🎭",
      description:
        "Élégance et mystère pour cette soirée masquée. Dress code : chic & masque obligatoire. Buffet, open bar soft et musique live.",
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      location: "Salle des fêtes — Centre-ville",
      theme: "Mascarade",
      imageUrls: [
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1600&q=85",
      ],
      maxCapacity: 150,
    },
    {
      title: "Beach Party 🏖️",
      description:
        "On transforme le rooftop en plage ! Sable, palmiers gonflables, maillots et musique tropicale. Concours de limbo inclus.",
      date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      location: "Rooftop — Bâtiment C",
      theme: "Tropical / Beach",
      imageUrls: [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
      ],
      maxCapacity: 120,
    },
    {
      title: "Disco Fever 🪩",
      description:
        "Boule à facettes, piste en parquet et playlist 100 % années 70–80. Concours de danse, shots à thème et dress code disco obligatoire.",
      date: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
      location: "Le Palace — Rue de la République",
      theme: "Années 80 / Disco",
      imageUrls: [
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=85",
      ],
      maxCapacity: 180,
    },
    {
      title: "Open Mic & Hip-hop 🎤",
      description:
        "Scène ouverte : beatmakers, MCs et slam. Jury étudiant, prix pour la meilleure perf. Ambiance club sombre et néons bleus.",
      date: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
      location: "Underground — Quai des Arts",
      theme: "Hip-hop / Open mic",
      imageUrls: [
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=85",
      ],
      maxCapacity: 100,
    },
    {
      title: "Noche Latina 💃",
      description:
        "Salsa, bachata et reggaetón toute la nuit. Cours d’initiation 21h, social dancing jusqu’au bout de la nuit. Mojitos à l’honneur.",
      date: new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000),
      location: "La Casa — Port de plaisance",
      theme: "Salsa / Bachata",
      imageUrls: [
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=85",
      ],
      maxCapacity: 160,
    },
  ];

  for (const eventData of events) {
    const event = await prisma.event.create({
      data: {
        ...eventData,
        status: "PUBLISHED",
        creatorId: admin.id,
        voteTopics: {
          create: [
            {
              category: "BUDGET",
              label: `Budget pour "${eventData.title}"`,
              closesAt: new Date(eventData.date.getTime() - 2 * 24 * 60 * 60 * 1000),
              options: {
                create: [
                  { label: "300 000 FCFA", value: 300000 },
                  { label: "500 000 FCFA", value: 500000 },
                  { label: "750 000 FCFA", value: 750000 },
                  { label: "1 000 000 FCFA", value: 1000000 },
                ],
              },
            },
            {
              category: "ENTRY_PRICE",
              label: `Prix d'entrée pour "${eventData.title}"`,
              closesAt: new Date(eventData.date.getTime() - 2 * 24 * 60 * 60 * 1000),
              options: {
                create: [
                  { label: "Gratuit", value: 0 },
                  { label: "1 000 FCFA", value: 1000 },
                  { label: "2 000 FCFA", value: 2000 },
                  { label: "3 000 FCFA", value: 3000 },
                ],
              },
            },
          ],
        },
      },
    });

    // Add random participations
    for (const user of users.slice(0, Math.floor(Math.random() * 4) + 2)) {
      await prisma.participation.create({
        data: { userId: user.id, eventId: event.id },
      });
    }

    // Add comments
    const comments = [
      "Trop hâte !! 🔥",
      "On peut venir avec des potes extérieurs ?",
      "Le thème est incroyable, j'ai déjà ma tenue",
      "C'est à quelle heure exactement ?",
    ];
    for (let i = 0; i < Math.min(comments.length, users.length); i++) {
      await prisma.comment.create({
        data: {
          content: comments[i],
          userId: users[i].id,
          eventId: event.id,
        },
      });
    }
  }

  console.log("✅ Seed complete!");
  console.log(`   Admin: admin@partyhub.com / admin123456`);
  console.log(`   Users: alice@test.com / user123456 (etc.)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
