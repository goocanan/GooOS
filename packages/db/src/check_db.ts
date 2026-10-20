import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

async function run() {
  const { db, schema } = await import("./index.js");
  const { ilike, or } = await import("drizzle-orm");

  const txs = await db.select().from(schema.flowTransactions).where(
    or(
      ilike(schema.flowTransactions.description, "%bambu%"),
      ilike(schema.flowTransactions.description, "%creality%"),
      ilike(schema.flowTransactions.description, "%printer%"),
      ilike(schema.flowTransactions.description, "%a1 mini%"),
      ilike(schema.flowTransactions.description, "%combo%")
    )
  );
  console.log("MATCHING TRANSACTIONS COUNT:", txs.length);
  for (const t of txs) {
    console.log(`[${t.type}] ${t.date?.toISOString().slice(0, 10)} | Rp ${t.amount} | ${t.description} | cat: ${t.category}`);
  }

  const allAssets = await db.select().from(schema.flowAssets);
  console.log("\nALL ASSETS SAMPLES BY CATEGORY:");
  const parts = allAssets.filter(a => a.category === "part");
  console.log(`PARTS (${parts.length}):`, parts.map(p => ({ name: p.name, price: p.price, qty: p.quantity })));
  const tools = allAssets.filter(a => a.category === "tool");
  console.log(`TOOLS (${tools.length}):`, tools.map(t => ({ name: t.name, price: t.price, qty: t.quantity })));
  const packing = allAssets.filter(a => a.category === "packing");
  console.log(`PACKING (${packing.length}):`, packing.map(pk => ({ name: pk.name, price: pk.price, qty: pk.quantity })));

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
