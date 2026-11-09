import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

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

    // Owner credentials hash for password 'admin12345'
    const ownerPasswordHash =
      "786c94cc9988458efa332f67e75b4974:f2d5f577f75e98df54e87e33c6b6936a02ee32b63db3468257059987c7f291ba0e1846e903cf9bf9a803a4e8b56bc5d64353ecfffaf5d976285e0d1c1f3b3ed5";

    // 2. Ensure Primary Owner User exists: admin@goocanan.com
    const primaryAdminEmail = "admin@goocanan.com";
    const primaryAdminId = "usr_admin_goocanan_owner";
    let admin = await sql`SELECT * FROM users WHERE email = ${primaryAdminEmail} LIMIT 1`;
    if (admin.length === 0) {
      await sql`
        INSERT INTO users (id, name, email, email_verified, title, active, created_at, updated_at)
        VALUES (${primaryAdminId}, 'Owner Goocanan', ${primaryAdminEmail}, true, 'Owner & Administrator', true, NOW(), NOW())
      `;
      console.log(`  ✅ Primary Owner User created: Owner Goocanan (${primaryAdminEmail})`);
    } else {
      await sql`
        UPDATE users 
        SET name = 'Owner Goocanan', email_verified = true, title = 'Owner & Administrator', active = true, updated_at = NOW()
        WHERE email = ${primaryAdminEmail}
      `;
      console.log(`  ✅ Existing Primary Owner User verified: ${primaryAdminEmail}`);
    }

    // Ensure credential account for admin@goocanan.com
    const existingAdminAcc = await sql`SELECT * FROM accounts WHERE user_id = ${primaryAdminId} AND provider_id = 'credential'`;
    if (existingAdminAcc.length === 0) {
      await sql`
        INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
        VALUES ('acc_usr_admin_goocanan_owner', ${primaryAdminId}, ${primaryAdminId}, 'credential', ${ownerPasswordHash}, NOW(), NOW())
      `;
      console.log("  ✅ Primary Owner credential record created (Password: admin12345)");
    } else {
      await sql`
        UPDATE accounts 
        SET password = ${ownerPasswordHash}, updated_at = NOW()
        WHERE user_id = ${primaryAdminId} AND provider_id = 'credential'
      `;
      console.log("  ✅ Primary Owner credential verified (Password: admin12345)");
    }

    // Link primary admin as owner
    await sql`
      INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
      VALUES (${workspaceId}, ${primaryAdminId}, 'owner', NOW())
      ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner'
    `;

    // 3. Ensure Secondary Owner User exists: james@goocanan3d.com
    let james = await sql`SELECT * FROM users WHERE email = 'james@goocanan3d.com' OR email = 'james@goocanan.com' LIMIT 1`;
    let jamesId = "fl198gkgaDmA4tQHSject4zcUNf3THbx";
    if (james.length === 0) {
      await sql`
        INSERT INTO users (id, name, email, email_verified, title, active, created_at, updated_at)
        VALUES (${jamesId}, 'James Goocanan', 'james@goocanan3d.com', true, 'Founder & Owner', true, NOW(), NOW())
      `;
      console.log("  ✅ Secondary Owner created: James Goocanan (james@goocanan3d.com)");
    } else {
      jamesId = james[0].id;
      await sql`
        UPDATE users 
        SET name = 'James Goocanan', email_verified = true, title = 'Founder & Owner', active = true, updated_at = NOW()
        WHERE id = ${jamesId}
      `;
      console.log(`  ✅ Existing Secondary Owner verified: ${james[0].email}`);
    }

    const existingJamesAcc = await sql`SELECT * FROM accounts WHERE user_id = ${jamesId} AND provider_id = 'credential'`;
    if (existingJamesAcc.length === 0) {
      await sql`
        INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
        VALUES ('acc_james_goocanan_key', ${jamesId}, ${jamesId}, 'credential', ${ownerPasswordHash}, NOW(), NOW())
      `;
      console.log("  ✅ Secondary Owner credential record created (Password: admin12345)");
    } else {
      await sql`
        UPDATE accounts 
        SET password = ${ownerPasswordHash}, updated_at = NOW()
        WHERE user_id = ${jamesId} AND provider_id = 'credential'
      `;
      console.log("  ✅ Secondary Owner credential verified (Password: admin12345)");
    }

    await sql`
      INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
      VALUES (${workspaceId}, ${jamesId}, 'owner', NOW())
      ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner'
    `;

    // 4. Ensure Demo User (Read-Only) exists
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
    const demoPasswordHash =
      "dc57965d5c0d39efaa62f0755d343140:13df907de61a8e4b9390b2d06e6dfb2f79667f844b6fd3c4f51c6508fde647e09b23fa224138a0c03bea41f48f44259935419ed88eac36416c24c92ba101b068";
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

    console.log("\n✅ Seed complete! Accounts ready to use:");
    console.log("   👑 OWNER / ADMIN (Akses Penuh):");
    console.log("      - Email: admin@goocanan.com (atau james@goocanan3d.com)");
    console.log("      - Password: admin12345");
    console.log("      - Permissions: Owner (Full read/write, tambah produk, pesanan, inventaris)");
    console.log("   👀 DEMO (Hanya Baca):");
    console.log("      - Email: demo@goocanan.com");
    console.log("      - Password: demouser123");
  } finally {
    await sql.end();
  }
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
