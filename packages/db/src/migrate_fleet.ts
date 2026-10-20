import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

async function run() {
  const { db, schema } = await import("./index.js");
  const postgres = (await import("postgres")).default;
  const sql = postgres(process.env.DATABASE_URL!, { max: 2 });

  console.log("Applying ALTER TABLE schema updates...");

  // 1. Flow Printers
  await sql`
    ALTER TABLE flow_printers 
    ADD COLUMN IF NOT EXISTS purchase_price double precision DEFAULT 0,
    ADD COLUMN IF NOT EXISTS purchase_date timestamp,
    ADD COLUMN IF NOT EXISTS serial_number varchar(100),
    ADD COLUMN IF NOT EXISTS build_volume varchar(100),
    ADD COLUMN IF NOT EXISTS nozzle_installed varchar(100),
    ADD COLUMN IF NOT EXISTS bed_plate_installed varchar(100),
    ADD COLUMN IF NOT EXISTS maintenance_interval_days integer DEFAULT 30,
    ADD COLUMN IF NOT EXISTS last_maintenance_date timestamp,
    ADD COLUMN IF NOT EXISTS next_maintenance_date timestamp,
    ADD COLUMN IF NOT EXISTS maintenance_checklist jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS notes text;
  `;
  console.log("flow_printers columns verified.");

  // 2. Flow Assets
  await sql`
    ALTER TABLE flow_assets
    ADD COLUMN IF NOT EXISTS printer_id text,
    ADD COLUMN IF NOT EXISTS purchase_date timestamp,
    ADD COLUMN IF NOT EXISTS part_category varchar(100),
    ADD COLUMN IF NOT EXISTS condition varchar(50) DEFAULT 'new';
  `;
  console.log("flow_assets columns verified.");

  // 3. Flow Transactions
  await sql`
    ALTER TABLE flow_transactions
    ADD COLUMN IF NOT EXISTS printer_id text,
    ADD COLUMN IF NOT EXISTS part_category varchar(100);
  `;
  console.log("flow_transactions columns verified.");

  // 4. Update printers data
  const bambuId = "97098b64-98e0-4d8c-907c-c482b6af07fd";
  const crealityId = "f2dcf0ce-2826-49ff-99cf-8773d97fc32d";

  const bambuChecklist = [
    {
      id: "clean_bed",
      title: "Cuci Bed Sheet dengan Dishwashing Soap & Air Hangat",
      frequency: "Tiap 5-10 print / jika first layer kurang rekat",
      lastCompleted: "2026-10-12",
      done: true,
    },
    {
      id: "lube_rails",
      title: "Pelumasan Linear Rail X/Y & Guide Rods dengan Grease/Oil",
      frequency: "Rutin setiap 1 bulan",
      lastCompleted: "2026-09-25",
      done: true,
    },
    {
      id: "cold_pull_nozzle",
      title: "Cold Pull & Bersihkan Carbonized Residue Nozzle",
      frequency: "Tiap 50 jam cetak / saat berganti material filamen",
      lastCompleted: "2026-10-05",
      done: true,
    },
    {
      id: "check_belts",
      title: "Cek Ketegangan Belt X/Y & Retensioning Springs",
      frequency: "Tiap 3 bulan",
      lastCompleted: "2026-08-15",
      done: true,
    },
    {
      id: "clean_fans",
      title: "Bersihkan Debu di Kipas Hotend & Part Cooling Fan",
      frequency: "Tiap 1 bulan",
      lastCompleted: "2026-09-28",
      done: true,
    },
  ];

  const crealityChecklist = [
    {
      id: "clean_bed",
      title: "Bersihkan Bed Plate dengan Isopropyl Alcohol (IPA 99%)",
      frequency: "Tiap sebelum print besar / 5 kali cetak",
      lastCompleted: "2026-10-15",
      done: true,
    },
    {
      id: "lube_z_axis",
      title: "Lumasi Lead Screw Z & Rods dengan PTFE Lubricant",
      frequency: "Rutin setiap 1 bulan",
      lastCompleted: "2026-09-20",
      done: true,
    },
    {
      id: "check_ext_gear",
      title: "Pembersihan Gerigi Dual-Drive Extruder dari Serbuk Filamen",
      frequency: "Tiap 1 bulan",
      lastCompleted: "2026-09-18",
      done: true,
    },
    {
      id: "check_belt_tension",
      title: "Cek Ketegangan Belt CoreXY & V-Wheel Alignment",
      frequency: "Tiap 3 bulan",
      lastCompleted: "2026-08-10",
      done: false,
    },
    {
      id: "check_nozzle_wear",
      title: "Periksa Keausan Diameter Lubang Nozzle & Heatblock Tightness",
      frequency: "Tiap 2 bulan",
      lastCompleted: "2026-09-10",
      done: true,
    },
  ];

  await sql`
    UPDATE flow_printers
    SET 
      purchase_price = 4856400,
      purchase_date = '2024-07-10 00:00:00'::timestamp,
      build_volume = '180 x 180 x 180 mm',
      nozzle_installed = '0.4mm Stainless Steel',
      bed_plate_installed = 'Textured PEI Plate',
      serial_number = '03099A441300084',
      maintenance_interval_days = 30,
      last_maintenance_date = '2026-09-25 00:00:00'::timestamp,
      next_maintenance_date = '2026-10-25 00:00:00'::timestamp,
      maintenance_checklist = ${JSON.stringify(bambuChecklist)}::jsonb,
      notes = 'Printer utama untuk part presisi tinggi dan multicolor AMS'
    WHERE id = ${bambuId};
  `;

  await sql`
    UPDATE flow_printers
    SET 
      purchase_price = 6855100,
      purchase_date = '2025-09-17 00:00:00'::timestamp,
      build_volume = '220 x 220 x 250 mm',
      nozzle_installed = '0.4mm Quick-Swap',
      bed_plate_installed = 'Smooth PEI Plate',
      serial_number = 'CR2025HI0917001',
      maintenance_interval_days = 30,
      last_maintenance_date = '2026-09-20 00:00:00'::timestamp,
      next_maintenance_date = '2026-10-20 00:00:00'::timestamp,
      maintenance_checklist = ${JSON.stringify(crealityChecklist)}::jsonb,
      notes = 'Printer kerja cepat volume sedang dengan enclosure'
    WHERE id = ${crealityId};
  `;
  console.log("Printers data updated successfully.");

  // 5. Update flow_assets parts & tools with printerId, partCategory, and purchaseDate
  await sql`
    UPDATE flow_assets
    SET 
      printer_id = ${bambuId},
      part_category = 'bed_sheet',
      purchase_date = '2025-05-30 00:00:00'::timestamp,
      condition = 'in_use'
    WHERE name ILIKE '%BTT PEI BED%';
  `;

  await sql`
    UPDATE flow_assets
    SET 
      printer_id = ${bambuId},
      part_category = 'bed_sheet',
      purchase_date = '2025-10-24 00:00:00'::timestamp,
      condition = 'backup'
    WHERE name ILIKE '%FROSTBITE%';
  `;

  await sql`
    UPDATE flow_assets
    SET 
      printer_id = ${bambuId},
      part_category = 'bed_sheet',
      purchase_date = '2024-11-11 00:00:00'::timestamp,
      condition = 'backup'
    WHERE name ILIKE '%DUAL PEF%';
  `;

  await sql`
    UPDATE flow_assets
    SET 
      printer_id = ${bambuId},
      part_category = 'nozzle',
      purchase_date = '2024-11-11 00:00:00'::timestamp,
      condition = 'backup'
    WHERE name ILIKE '%0.2mm NOZZLE%';
  `;

  await sql`
    UPDATE flow_assets
    SET 
      printer_id = ${bambuId},
      part_category = 'hotend_extruder',
      purchase_date = '2024-11-18 00:00:00'::timestamp,
      condition = 'in_use'
    WHERE name ILIKE '%SILICONE SOCK%';
  `;

  await sql`
    UPDATE flow_assets
    SET 
      printer_id = ${crealityId},
      part_category = 'nozzle',
      purchase_date = '2025-10-17 00:00:00'::timestamp,
      condition = 'backup'
    WHERE name ILIKE '%0.8MM NOZZLE%';
  `;

  await sql`
    UPDATE flow_assets
    SET 
      part_category = 'hotend_extruder',
      purchase_date = '2025-04-14 00:00:00'::timestamp,
      condition = 'backup'
    WHERE name ILIKE '%BOWDEN CONNECTOR%';
  `;

  await sql`
    UPDATE flow_assets
    SET 
      part_category = 'hotend_extruder',
      purchase_date = '2025-04-14 00:00:00'::timestamp,
      condition = 'backup'
    WHERE name ILIKE '%BOWDEN TEFLON%';
  `;

  await sql`
    UPDATE flow_assets
    SET 
      part_category = 'lubricant_consumable',
      purchase_date = '2025-04-14 00:00:00'::timestamp,
      condition = 'in_use'
    WHERE name ILIKE '%GREASE OIL%';
  `;

  await sql`
    UPDATE flow_assets
    SET 
      part_category = 'hotend_extruder',
      purchase_date = '2025-04-14 00:00:00'::timestamp,
      condition = 'backup'
    WHERE name ILIKE '%PNEUMATIC%';
  `;

  // Tools purchase dates
  await sql`
    UPDATE flow_assets
    SET purchase_date = '2025-09-23 00:00:00'::timestamp
    WHERE name ILIKE '%SPACE PI%';
  `;
  await sql`
    UPDATE flow_assets
    SET purchase_date = '2025-09-01 00:00:00'::timestamp
    WHERE name ILIKE '%RECIPROCATING SANDER%';
  `;
  await sql`
    UPDATE flow_assets
    SET purchase_date = '2025-04-14 00:00:00'::timestamp
    WHERE name ILIKE '%DRYBOX%';
  `;
  await sql`
    UPDATE flow_assets
    SET purchase_date = '2025-04-25 00:00:00'::timestamp
    WHERE name ILIKE '%GLUE STICK%';
  `;
  await sql`
    UPDATE flow_assets
    SET purchase_date = '2025-04-14 00:00:00'::timestamp
    WHERE name ILIKE '%eSPOOL%';
  `;
  await sql`
    UPDATE flow_assets
    SET purchase_date = '2025-04-14 00:00:00'::timestamp
    WHERE name ILIKE '%CUTTING MAT%';
  `;
  await sql`
    UPDATE flow_assets
    SET purchase_date = '2025-04-14 00:00:00'::timestamp
    WHERE name ILIKE '%HYGROMETER%';
  `;

  // Fallback for tools without purchase_date: use created_at
  await sql`
    UPDATE flow_assets
    SET purchase_date = created_at
    WHERE purchase_date IS NULL;
  `;

  console.log("Assets updated with printerId, partCategory, and purchaseDate successfully.");

  // Also update transactions for parts & printers with printer_id
  await sql`
    UPDATE flow_transactions
    SET printer_id = ${bambuId}, part_category = 'bed_sheet'
    WHERE description ILIKE '%A1 MINI%' AND category = 'parts';
  `;
  await sql`
    UPDATE flow_transactions
    SET printer_id = ${crealityId}, part_category = 'nozzle'
    WHERE description ILIKE '%CREALITY HI%' AND category = 'parts';
  `;
  await sql`
    UPDATE flow_transactions
    SET printer_id = ${bambuId}
    WHERE description ILIKE '%Bambulab A1 mini%' AND category = 'printer';
  `;
  await sql`
    UPDATE flow_transactions
    SET printer_id = ${crealityId}
    WHERE description ILIKE '%CREALITY HI COMBO%' AND category = 'printer';
  `;

  console.log("Transactions updated with printer_id successfully.");
  await sql.end();
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration error:", e);
  process.exit(1);
});
