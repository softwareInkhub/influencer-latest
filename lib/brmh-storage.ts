import { randomUUID } from "crypto";
import { BRMHInfluencerAPI, type Influencer as BRMHInfluencer } from "./brmh-api";

export class BRMHStorage {
  private api: BRMHInfluencerAPI;

  constructor() {
    this.api = new BRMHInfluencerAPI();
  }

  async testConnection(): Promise<boolean> {
    return this.api.testConnection();
  }

  async getInfluencers(): Promise<BRMHInfluencer[]> {
    return this.api.getInfluencers();
  }

  async getInfluencer(id: string): Promise<BRMHInfluencer> {
    return this.api.getInfluencer(id);
  }

  async createInfluencer(data: any): Promise<BRMHInfluencer> {
    const nowIso = new Date().toISOString();
    const id = randomUUID();
    const payload: BRMHInfluencer = {
      id,
      name: data.name,
      email: data.email || "",
      phone: data.phone || "",
      address: data.address || "",
      status: data.status || "PendingApproval",
      socialMedia: data.socialMedia || {},
      categories: data.categories || [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const res = await this.api.createInfluencer(payload);
    // Some BRMH implementations return only ids; fetch the created item for consistency
    try {
      const created = await this.api.getInfluencer(id);
      return created;
    } catch {
      return payload;
    }
  }

  async updateInfluencer(id: string, updates: Partial<BRMHInfluencer>): Promise<BRMHInfluencer> {
    const payload: Partial<BRMHInfluencer> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.api.updateInfluencer(id, payload as BRMHInfluencer);
    const updated = await this.api.getInfluencer(id);
    return updated;
  }

  async deleteInfluencer(id: string): Promise<boolean> {
    const res = await this.api.deleteInfluencer(id);
    return !!res?.success;
  }
}


