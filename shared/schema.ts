import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Companies table
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  companyId: varchar("company_id").references(() => companies.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Roles table
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  permissions: json("permissions").$type<string[]>().default([]),
});

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  roleId: varchar("role_id").references(() => roles.id).notNull(),
  companyId: varchar("company_id").references(() => companies.id).notNull(),
  teamId: varchar("team_id").references(() => teams.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Influencers table
export const influencers = pgTable("influencers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  socialMedia: json("social_media").$type<{
    instagram?: { handle: string; followers: number };
    youtube?: { channel: string; subscribers: number };
    facebook?: { page: string; followers: number };
  }>().default({}),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  status: text("status").notNull().default("PendingApproval"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  influencerId: varchar("influencer_id").references(() => influencers.id).notNull(),
  companyId: varchar("company_id").references(() => companies.id),
  shopifyOrderId: text("shopify_order_id").notNull(),
  status: text("status").notNull().default("Created"),
  trackingInfo: json("tracking_info").$type<{
    status: string;
    trackingNumber: string;
    estimatedDelivery: Date;
  }>(),
  products: json("products").$type<Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>>().default([]),
  shippingDetails: json("shipping_details").$type<{
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
  }>(),
  totalAmount: integer("total_amount"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content table
export const content = pgTable("content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  s3Link: text("s3_link").notNull(),
  status: text("status").notNull().default("PendingUpload"),
  influencerId: varchar("influencer_id").references(() => influencers.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  editedBy: varchar("edited_by").references(() => users.id),
  companyId: varchar("company_id").references(() => companies.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Message Templates table
export const messageTemplates = pgTable("message_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  message: text("message").notNull(),
  workflowCategory: text("workflow_category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies);

export const insertTeamSchema = createInsertSchema(teams);

export const insertRoleSchema = createInsertSchema(roles);

export const insertUserSchema = createInsertSchema(users);

export const insertInfluencerSchema = createInsertSchema(influencers);

export const insertOrderSchema = createInsertSchema(orders);

export const insertContentSchema = createInsertSchema(content);

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates);

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Influencer = typeof influencers.$inferSelect;
export type InsertInfluencer = z.infer<typeof insertInfluencerSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
