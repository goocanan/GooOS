import "dotenv/config";
import postgres from "postgres";

async function seed() {
  console.log("🌱 Seeding GooOS database...");
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    // 1. Ensure workspace GOOCANAN exists
    let ws = await sql`SELECT * FROM workspaces WHERE slug = 'goocanan' OR id = 'ws_3817e3eb6c344c4da519' LIMIT 1`;
    let workspaceId = "ws_3817e3eb6c344c4da519";
    if (ws.length === 0) {
      const inserted = await sql`
        INSERT INTO workspaces (id, name, slug, plan, timezone, language, created_at, updated_at)
        VALUES (${workspaceId}, 'GOOCANAN', 'goocanan', 'free', 'Asia/Jakarta', 'id-ID', NOW(), NOW())
        RETURNING *
      `;
      const newWs = inserted[0];
      console.log(`  ✅ Workspace created: ${newWs?.name ?? "GOOCANAN"} (${newWs?.id ?? workspaceId})`);
    } else {
      const existingWs = ws[0];
      workspaceId = existingWs?.id ?? workspaceId;
      console.log(`  ✅ Existing Workspace: ${existingWs?.name ?? "GOOCANAN"} (${workspaceId})`);
    }

    // 2. Ensure Admin User exists
    let admin = await sql`SELECT * FROM users WHERE email = 'james@goocanan3d.com' OR email = 'james@goocanan.com' LIMIT 1`;
    let adminId = "fl198gkgaDmA4tQHSject4zcUNf3THbx";
    if (admin.length === 0) {
      const inserted = await sql`
        INSERT INTO users (id, name, email, email_verified, active, created_at, updated_at)
        VALUES (${adminId}, 'goocanan', 'james@goocanan3d.com', true, true, NOW(), NOW())
        RETURNING *
      `;
      const newAdmin = inserted[0];
      console.log(`  ✅ Admin User created: ${newAdmin?.name ?? "goocanan"} (${newAdmin?.email ?? "james@goocanan3d.com"})`);
    } else {
      const existingAdmin = admin[0];
      adminId = existingAdmin?.id ?? adminId;
      console.log(`  ✅ Existing Admin User: ${existingAdmin?.name ?? "goocanan"} (${existingAdmin?.email ?? "james@goocanan3d.com"})`);
    }

    // Link admin as owner
    await sql`
      INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
      VALUES (${workspaceId}, ${adminId}, 'owner', NOW())
      ON CONFLICT (workspace_id, user_id) DO NOTHING
    `;

    // 3. Ensure Demo User (Read-Only) exists
    let demo = await sql`SELECT * FROM users WHERE email = 'demo@goocanan.com' LIMIT 1`;
    let demoId = "MaE2yRuQ8AlmZrFbXzXeNXqVX0QGUAoL";
    if (demo.length === 0) {
      const inserted = await sql`
        INSERT INTO users (id, name, email, email_verified, title, active, created_at, updated_at)
        VALUES (${demoId}, 'Demo Account (Read Only)', 'demo@goocanan.com', true, 'demo_readonly', true, NOW(), NOW())
        RETURNING *
      `;
      const newDemo = inserted[0];
      console.log(`  ✅ Demo User created: ${newDemo?.name ?? "Demo"} (${newDemo?.email ?? "demo@goocanan.com"})`);
    } else {
      const existingDemo = demo[0];
      demoId = existingDemo?.id ?? demoId;
      await sql`UPDATE users SET title = 'demo_readonly' WHERE id = ${demoId}`;
      console.log(`  ✅ Existing Demo User updated: ${existingDemo?.name ?? "Demo"} (${existingDemo?.email ?? "demo@goocanan.com"})`);
    }

    // Ensure Demo Password Account exists (password: demouser123)
    const demoPasswordHash = "dc57965d5c0d39efaa62f0755d343140:13df907de61a8e4b9390b2d06e6dfb2f79667f844b6fd3c4f51c6508fde647e09b23fa224138a0c03bea41f48f44259935419ed88eac36416c24c92ba101b068";
    const existingDemoAcc = await sql`SELECT * FROM accounts WHERE user_id = ${demoId} AND provider_id = 'credential'`;
    if (existingDemoAcc.length === 0) {
      await sql`
        INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
        VALUES ('acc_demo_goocanan_key', ${demoId}, ${demoId}, 'credential', ${demoPasswordHash}, NOW(), NOW())
      `;
      console.log("  ✅ Demo Account credential record created (Password: demouser123)");
    } else {
      await sql`
        UPDATE accounts 
        SET password = ${demoPasswordHash}, updated_at = NOW()
        WHERE user_id = ${demoId} AND provider_id = 'credential'
      `;
      console.log("  ✅ Demo Account credential verified (Password: demouser123)");
    }

    // Link demo user to workspace as client (read-only member)
    await sql`
      INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
      VALUES (${workspaceId}, ${demoId}, 'client', NOW())
      ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'client'
    `;
    console.log(`  ✅ Linked Demo User to workspace as 'client' (Read-Only)`);

    console.log("\n✅ Seed complete! Demo account is ready to use:");
    console.log("   - Email: demo@goocanan.com");
    console.log("   - Password: demouser123");
    console.log("   - Permissions: Read-Only (Cannot input/modify data)");
  } finally {
    await sql.end();
  }
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
