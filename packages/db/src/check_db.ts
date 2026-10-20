import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

async function run() {
  const { db, schema } = await import("./index.js");
  const items = await db.select().from(schema.flowInventory);
  console.log("TOTAL INVENTORY SPOOLS:", items.length);

  let totalInitialWeight = 0;
  let totalCurrentWeight = 0;
  let totalValueInitial = 0;
  let totalValueRemaining = 0;

  for (const item of items) {
    const initW = item.initialWeight || 1000;
    const currW = item.currentWeight || 0;
    const ppg = item.pricePerGram || 0;
    totalInitialWeight += initW;
    totalCurrentWeight += currW;
    totalValueInitial += initW * ppg;
    totalValueRemaining += currW * ppg;
  }

  const totalUsedWeight = totalInitialWeight - totalCurrentWeight;
  const totalValueUsed = totalValueInitial - totalValueRemaining;

  console.log("ACCURATE RECALCULATED STATS:");
  console.log({
    spoolsCount: items.length,
    totalInitialWeightKg: (totalInitialWeight / 1000).toFixed(2) + " kg",
    totalCostInitial: "Rp " + Math.round(totalValueInitial).toLocaleString(),
    totalUsedWeightKg: (totalUsedWeight / 1000).toFixed(2) + " kg",
    totalUsedCost: "Rp " + Math.round(totalValueUsed).toLocaleString(),
    totalRemainingWeightKg: (totalCurrentWeight / 1000).toFixed(2) + " kg",
    totalRemainingCost: "Rp " + Math.round(totalValueRemaining).toLocaleString(),
    usagePercentage: ((totalUsedWeight / totalInitialWeight) * 100).toFixed(1) + "%",
    remainingPercentage: ((totalCurrentWeight / totalInitialWeight) * 100).toFixed(1) + "%",
  });

  process.exit(0);
}
run();
