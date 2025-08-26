import { 
  type Company, type InsertCompany,
  type Team, type InsertTeam,
  type Role, type InsertRole,
  type User, type InsertUser,
  type Influencer, type InsertInfluencer,
  type Order, type InsertOrder,
  type Content, type InsertContent,
  type MessageTemplate, type InsertMessageTemplate
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Company methods
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;

  // Team methods
  getTeams(companyId: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;

  // Role methods
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;

  // Influencer methods
  getInfluencers(): Promise<Influencer[]>;
  getInfluencer(id: string): Promise<Influencer | undefined>;
  createInfluencer(influencer: InsertInfluencer): Promise<Influencer>;
  updateInfluencer(id: string, influencer: Partial<Influencer>): Promise<Influencer>;
  deleteInfluencer(id: string): Promise<boolean>;

  // Order methods
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order>;

  // Content methods
  getContent(): Promise<Content[]>;
  getContentByInfluencer(influencerId: string): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: string, content: Partial<Content>): Promise<Content>;

  // Message Template methods
  getMessageTemplates(): Promise<MessageTemplate[]>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
}

export class MemStorage implements IStorage {
  private companies: Map<string, Company> = new Map();
  private teams: Map<string, Team> = new Map();
  private roles: Map<string, Role> = new Map();
  private users: Map<string, User> = new Map();
  private influencers: Map<string, Influencer> = new Map();
  private orders: Map<string, Order> = new Map();
  private content: Map<string, Content> = new Map();
  private messageTemplates: Map<string, MessageTemplate> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize only essential roles - no dummy data
    const adminRole: Role = {
      id: randomUUID(),
      name: "Admin",
      permissions: ["read", "write", "delete", "approve"]
    };
    const influencerRole: Role = {
      id: randomUUID(),
      name: "Influencer",
      permissions: ["read", "upload"]
    };
    this.roles.set(adminRole.id, adminRole);
    this.roles.set(influencerRole.id, influencerRole);

    // No dummy data - only real data from BRMH will be used
    console.log('Storage initialized with no dummy data - only real data from BRMH will be used');
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user = { 
      ...insertUser, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    } as User;
    this.users.set(id, user);
    return user;
  }

  // Company methods
  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const company = { 
      ...insertCompany, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    } as Company;
    this.companies.set(id, company);
    return company;
  }

  // Team methods
  async getTeams(companyId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(team => team.companyId === companyId);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team = { 
      ...insertTeam, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    } as Team;
    this.teams.set(id, team);
    return team;
  }

  // Role methods
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = randomUUID();
    const role = { ...insertRole, id } as Role;
    this.roles.set(id, role);
    return role;
  }

  // Influencer methods
  async getInfluencers(): Promise<Influencer[]> {
    return Array.from(this.influencers.values());
  }

  async getInfluencer(id: string): Promise<Influencer | undefined> {
    return this.influencers.get(id);
  }

  async createInfluencer(insertInfluencer: InsertInfluencer): Promise<Influencer> {
    const id = randomUUID();
    const influencer = { 
      ...insertInfluencer, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    } as Influencer;
    this.influencers.set(id, influencer);
    return influencer;
  }

  async updateInfluencer(id: string, updates: Partial<Influencer>): Promise<Influencer> {
    const influencer = this.influencers.get(id);
    if (!influencer) throw new Error("Influencer not found");
    
    const updated: Influencer = { 
      ...influencer, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.influencers.set(id, updated);
    return updated;
  }

  async deleteInfluencer(id: string): Promise<boolean> {
    const existed = this.influencers.has(id);
    this.influencers.delete(id);
    return existed;
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order = { 
      ...insertOrder, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    } as Order;
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error("Order not found");
    
    const updated: Order = { 
      ...order, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.orders.set(id, updated);
    return updated;
  }

  // Content methods
  async getContent(): Promise<Content[]> {
    return Array.from(this.content.values());
  }

  async getContentByInfluencer(influencerId: string): Promise<Content[]> {
    return Array.from(this.content.values()).filter(content => content.influencerId === influencerId);
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = randomUUID();
    const content = { 
      ...insertContent, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    } as Content;
    this.content.set(id, content);
    return content;
  }

  async updateContent(id: string, updates: Partial<Content>): Promise<Content> {
    const content = this.content.get(id);
    if (!content) throw new Error("Content not found");
    
    const updated: Content = { 
      ...content, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.content.set(id, updated);
    return updated;
  }

  // Message Template methods
  async getMessageTemplates(): Promise<MessageTemplate[]> {
    return Array.from(this.messageTemplates.values());
  }

  async createMessageTemplate(insertTemplate: InsertMessageTemplate): Promise<MessageTemplate> {
    const id = randomUUID();
    const template = { 
      ...insertTemplate, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    } as MessageTemplate;
    this.messageTemplates.set(id, template);
    return template;
  }
}

export const storage = new MemStorage();
