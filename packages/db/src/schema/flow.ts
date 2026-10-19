import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  doublePrecision,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workspaces } from "./index";

// ──────────────────────────────────────────────
// 3D PRINTING & FLOW SCHEMAS (Copied from 3DFlow & GOO-Studio)
// ──────────────────────────────────────────────

export const flowInventory = pgTable("flow_inventory", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  brand: varchar("brand", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }),
  version: varchar("version", { length: 255 }),
  materialType: text("material_type").notNull(),
  color: varchar("color", { length: 100 }).notNull(),
  colorHex: varchar("color_hex", { length: 20 }),
  currentWeight: doublePrecision("current_weight").notNull().default(0),
  initialWeight: doublePrecision("initial_weight").notNull().default(1000),
  pricePerGram: doublePrecision("price_per_gram").notNull().default(0),
  imageUrl: text("image_url"),
  productLink: text("product_link"),
  lowStockThreshold: integer("low_stock_threshold").default(100),
  purchaseDate: timestamp("purchase_date"),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flowInventoryTransactions = pgTable("flow_inventory_transactions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  inventoryId: text("inventory_id"),
  orderId: text("order_id"),
  transactionType: text("transaction_type").notNull(),
  weightChange: doublePrecision("weight_change").notNull(),
  notes: text("notes"),
  referenceId: text("reference_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const flowPrinters = pgTable("flow_printers", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  status: text("status").default("offline"),
  nozzleTemp: doublePrecision("nozzle_temp").default(0),
  bedTemp: doublePrecision("bed_temp").default(0),
  printProgress: integer("print_progress").default(0),
  currentJob: varchar("current_job", { length: 255 }),
  errorMessage: text("error_message"),
  lastMaintenance: timestamp("last_maintenance"),
  productLink: text("product_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flowProjects = pgTable("flow_projects", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("idea"),
  priority: varchar("priority", { length: 50 }).default("medium"),
  notes: text("notes"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flowBatches = pgTable("flow_batches", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  material: varchar("material", { length: 100 }).notNull(),
  color: varchar("color", { length: 100 }).notNull(),
  totalWeight: integer("total_weight").default(0),
  spoolId: text("spool_id"),
  bedPlate: varchar("bed_plate", { length: 100 }),
  bedWidth: integer("bed_width").default(0),
  bedDepth: integer("bed_depth").default(0),
  status: varchar("status", { length: 50 }).default("ready"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flowParts = pgTable("flow_parts", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => flowProjects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  material: varchar("material", { length: 100 }).notNull(),
  color: varchar("color", { length: 100 }).notNull(),
  weight: integer("weight").default(0),
  printDurationMinutes: integer("print_duration_minutes").default(0),
  quantity: integer("quantity").default(1),
  status: varchar("status", { length: 50 }).default("pending"),
  path: text("path"),
  dimX: integer("dim_x").default(0),
  dimY: integer("dim_y").default(0),
  dimZ: integer("dim_z").default(0),
  batchId: text("batch_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flowOrders = pgTable("flow_orders", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  modelName: varchar("model_name", { length: 255 }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  progress: integer("progress").default(0),
  price: doublePrecision("price").default(0).notNull(),
  source: varchar("source", { length: 50 }).default("direct"),
  modelImageUrl: text("model_image_url"),
  materialType: varchar("material_type", { length: 50 }),
  materialColor: varchar("material_color", { length: 50 }),
  quantity: integer("quantity").default(1),
  qtyPart: integer("qty_part").default(1),
  infill: varchar("infill", { length: 50 }),
  layerHeight: text("layer_height"),
  weight: doublePrecision("weight"),
  time: doublePrecision("time"),
  dueDate: text("due_date"),
  estimatedCompletion: timestamp("estimated_completion"),
  timeRemaining: integer("time_remaining"),
  batchId: varchar("batch_id", { length: 50 }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flowOrderItems = pgTable("flow_order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => flowOrders.id, { onDelete: "cascade" }),
  inventoryId: text("inventory_id"),
  weightUsed: doublePrecision("weight_used").notNull(),
  cost: doublePrecision("cost").notNull(),
});

export const flowProducts = pgTable("flow_products", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  imageUrl: text("image_url"),
  modelWeight: doublePrecision("model_weight").default(0),
  printingTime: doublePrecision("printing_time").default(0),
  materialCost: doublePrecision("material_cost").default(0),
  energyCost: doublePrecision("energy_cost").default(0),
  wearCost: doublePrecision("wear_cost").default(0),
  packagingCost: doublePrecision("packaging_cost").default(0),
  taxRate: doublePrecision("tax_rate").default(0),
  finalPrice: doublePrecision("final_price").default(0),
  link1: text("link1"),
  link2: text("link2"),
  marginPercent: doublePrecision("margin_percent").default(60),
  manualPrice: doublePrecision("manual_price"),
  notes: text("notes"),
  description: text("description"),
  referenceLink: text("reference_link"),
  selectedMaterialId: text("selected_material_id"),
  qtyPart: integer("qty_part").default(1),
  infill: varchar("infill", { length: 50 }),
  layerHeight: varchar("layer_height", { length: 50 }),
  category: varchar("category", { length: 100 }).default("General"),
  items: jsonb("items").default([]),
  pricingMode: varchar("pricing_mode", { length: 50 }).default("total_modal"),
  options: jsonb("options").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flowSettings = pgTable("flow_settings", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  electricityCostPerKwh: integer("electricity_cost_per_kwh").default(1500),
  printerPowerWatt: integer("printer_power_watt").default(150),
  operatorCostPerHour: integer("operator_cost_per_hour").default(25000),
  defaultMarginPercent: integer("default_margin_percent").default(50),
  investmentCostTotal: integer("investment_cost_total").default(5000000),
  investmentPaybackMonths: integer("investment_payback_months").default(12),
  monthlyPrintHours: integer("monthly_print_hours").default(150),
  lowStockThreshold: integer("low_stock_threshold").default(200),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flowAssets = pgTable("flow_assets", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).default("tool"),
  quantity: integer("quantity").default(1),
  initialQuantity: integer("initial_quantity").default(1),
  price: doublePrecision("price").default(0),
  notes: text("notes"),
  productLink: text("product_link"),
  type: varchar("type", { length: 100 }),
  size: varchar("size", { length: 100 }),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flowTransactions = pgTable("flow_transactions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).default("other"),
  type: varchar("type", { length: 50 }).default("expense"),
  amount: doublePrecision("amount").default(0).notNull(),
  quantity: integer("quantity").default(1),
  date: timestamp("date").defaultNow().notNull(),
  orderId: text("order_id"),
  inventoryId: text("inventory_id"),
  batchId: text("batch_id"),
  productLink: text("product_link"),
  colorHex: varchar("color_hex", { length: 20 }),
  materialType: varchar("material_type", { length: 50 }),
  size: varchar("size", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const flowProjectsRelations = relations(flowProjects, ({ many }) => ({
  parts: many(flowParts),
}));

export const flowPartsRelations = relations(flowParts, ({ one }) => ({
  project: one(flowProjects, {
    fields: [flowParts.projectId],
    references: [flowProjects.id],
  }),
}));

export const flowOrdersRelations = relations(flowOrders, ({ many }) => ({
  items: many(flowOrderItems),
}));

