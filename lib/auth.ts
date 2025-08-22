import type { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { insertUserSchema, type Role } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; username: string; roleName: string };
}

async function ensureRole(roleName: string): Promise<Role> {
  const roles = await storage.getRoles();
  const existing = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
  if (existing) return existing as unknown as Role;
  const created = await storage.createRole({ name: roleName, permissions: [] });
  return created as unknown as Role;
}

export function signToken(payload: { id: string; username: string; roleName: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "2d" });
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });
    const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    const parts = token.split(" ");
    const jwtToken = parts.length === 2 ? parts[1] : parts[0];
    const decoded = jwt.verify(jwtToken, JWT_SECRET) as { id: string; username: string; roleName: string };
    req.user = { id: decoded.id, username: decoded.username, roleName: decoded.roleName };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const ok = allowedRoles.map(r => r.toLowerCase()).includes(req.user.roleName.toLowerCase());
    if (!ok) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, roleName, name, phone, email } = req.body || {};
      if (!username || !password || !roleName) {
        return res.status(400).json({ error: "username, password and roleName are required" });
      }
      const role = await ensureRole(roleName);
      const parsed = insertUserSchema.parse({
        username,
        password,
        name: name || username,
        phone: phone || "",
        email: email || `${username}@example.com`,
        roleId: role.id,
        companyId: "default-company",
        teamId: null as any,
      });
      const user = await storage.createUser(parsed);
      const token = signToken({ id: user.id, username: user.username, roleName });
      return res.json({ token, user: { id: user.id, username: user.username, roleName } });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || "Failed to register" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password are required" });
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" });
    const roles = await storage.getRoles();
    const role = roles.find(r => r.id === user.roleId);
    const roleName = role?.name || "influencer";
    const token = signToken({ id: user.id, username: user.username, roleName });
    return res.json({ token, user: { id: user.id, username: user.username, roleName } });
  });
}

export async function seedAuth() {
  const adminRole = await ensureRole("admin");
  await ensureRole("influencer");
  await ensureRole("editor");
  const existing = await storage.getUserByUsername("admin");
  if (!existing) {
    await storage.createUser({
      username: "admin",
      password: "admin",
      name: "Administrator",
      phone: "",
      email: "admin@example.com",
      roleId: adminRole.id,
      companyId: "default-company",
      teamId: null as any,
    });
    console.log("Seeded default admin user -> username: admin, password: admin");
  }
}



