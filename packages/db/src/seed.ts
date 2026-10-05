import "dotenv/config";
import { db } from "../src/index.js";
import * as schema from "../src/schema/index.js";

async function seed() {
  console.log("🌱 Seeding GooOS database...");

  // ── Create demo user
  const [james] = await db
    .insert(schema.users)
    .values({
      email: "james@goocanan.com",
      name: "James William Jokanan",
      emailVerified: true,
    })
    .returning();

  console.log(`  ✅ User: ${james.name} (${james.email})`);

  // ── Create workspace: GOOCANAN 3D
  const [goocanan] = await db
    .insert(schema.workspaces)
    .values({
      name: "GOOCANAN 3D",
      slug: "goocanan-3d",
      description: "Precision in Every Layer — 3D Printing Service & Content",
    })
    .returning();

  console.log(`  ✅ Workspace: ${goocanan.name}`);

  // ── Create workspace: Personal Content
  const [personal] = await db
    .insert(schema.workspaces)
    .values({
      name: "Personal Content",
      slug: "personal-content",
      description: "Personal content creation",
    })
    .returning();

  console.log(`  ✅ Workspace: ${personal.name}`);

  // ── Link James as owner of all workspaces
  for (const ws of [goocanan, personal]) {
    await db.insert(schema.workspaceMembers).values({
      workspaceId: ws.id,
      userId: james.id,
      role: "owner",
    });
  }
  console.log(`  ✅ Linked James as owner of all workspaces`);

  // ── Create brand: Goocanan 3D
  const [brand] = await db
    .insert(schema.brands)
    .values({
      workspaceId: goocanan.id,
      name: "Goocanan 3D",
      slug: "goocanan-3d",
      description: "Precision in Every Layer",
      primaryColor: "#8B1E3F",
      secondaryColor: "#D4AF37",
      toneOfVoice: "Professional + Friendly",
      targetAudience: "3D Printing Hobbyist, Engineer, Maker",
      industry: "3D Printing / Manufacturing",
      keywords: ["Precision", "3D Printing", "Engineering", "Innovation"],
      guidelines: {
        tone: "Professional + Friendly",
        primaryColor: "#8B1E3F",
        secondaryColor: "#D4AF37",
      },
    })
    .returning();

  console.log(`  ✅ Brand: ${brand.name} (#${brand.primaryColor} + #${brand.secondaryColor})`);

  // ── Create sample content
  const [content1] = await db
    .insert(schema.content)
    .values({
      workspaceId: goocanan.id,
      brandId: brand.id,
      title: "Video: Apakah PLA bisa dipakai untuk outdoor?",
      description:
        "Edukasi tentang keterbatasan PLA untuk pemakaian outdoor akibat glass transition temperature.",
      type: "tiktok",
      status: "idea",
      priority: "high",
      createdBy: james.id,
    })
    .returning();

  console.log(`  ✅ Content: ${content1.title}`);

  console.log("\n✅ Seed complete! GooOS is ready to go.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
