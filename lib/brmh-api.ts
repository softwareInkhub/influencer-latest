export interface Influencer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  // Map to existing table fields
  role?: string; // Will store influencer type
  teamId?: string; // Will store categories as JSON string
  companyId?: string; // Will store social media as JSON string
  // Additional fields for influencer data
  socialMedia?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
  };
  followers?: number;
  engagement?: number;
  categories?: string[];
  status?: string;
  bio?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInfluencerRequest {
  item: Influencer;
}

export interface UpdateInfluencerRequest {
  item: Partial<Influencer>;
}

export class BRMHInfluencerAPI {
  private baseURL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/crud`;
  private tableName = 'brmh-influencers';

  // Transform influencer data to match table structure
  private transformToTableData(influencer: Influencer): any {
    return {
      id: influencer.id,
      name: influencer.name,
      email: influencer.email,
      phone: influencer.phone || '',
      // BRMH schema: custom fields live under `data`
      data: {
        ...(influencer.address !== undefined ? { address: influencer.address } : {}),
      },
      role: influencer.status || 'influencer',
      teamId: influencer.categories ? JSON.stringify(influencer.categories) : '',
      companyId: influencer.socialMedia ? JSON.stringify(influencer.socialMedia) : '',
      createdAt: influencer.createdAt || new Date().toISOString(),
      updatedAt: influencer.updatedAt || new Date().toISOString()
    };
  }

  // Transform table data back to influencer format
  private transformFromTableData(tableData: any): Influencer {
    console.log('=== TRANSFORM FROM TABLE DATA ===');
    console.log('Input table data:', JSON.stringify(tableData, null, 2));
    
    let categories = [];
    let socialMedia = {};
    
    try {
      if (tableData.teamId && tableData.teamId.trim() !== '') {
        categories = JSON.parse(tableData.teamId);
      }
    } catch (error) {
      console.error('Error parsing teamId:', error);
      categories = [];
    }
    
    try {
      if (tableData.companyId && tableData.companyId.trim() !== '') {
        socialMedia = JSON.parse(tableData.companyId);
      }
    } catch (error) {
      console.error('Error parsing companyId:', error);
      socialMedia = {};
    }
    
    // Address may be stored either top-level (legacy) or under data.address (BRMH schema)
    let extractedAddress: string | undefined = undefined;
    try {
      if (tableData) {
        if (typeof tableData.address === 'string' && tableData.address.trim() !== '') {
          extractedAddress = tableData.address;
        } else if (tableData.data) {
          const dataObj = typeof tableData.data === 'string' ? JSON.parse(tableData.data) : tableData.data;
          if (dataObj && typeof dataObj.address === 'string') extractedAddress = dataObj.address;
        }
      }
    } catch (e) {
      console.warn('Failed to read address from tableData.data:', e);
    }

    const result = {
      id: tableData.id,
      name: tableData.name,
      email: tableData.email,
      phone: tableData.phone,
      address: extractedAddress,
      status: tableData.role,
      categories: categories,
      socialMedia: socialMedia,
      createdAt: tableData.createdAt,
      updatedAt: tableData.updatedAt
    };
    
    console.log('Transformed result:', JSON.stringify(result, null, 2));
    return result;
  }

  // Create influencer
  async createInfluencer(influencer: Influencer): Promise<{ success: boolean; itemId: string }> {
    console.log('=== BRMH API: CREATE INFLUENCER ===');
    console.log('Input influencer data:', JSON.stringify(influencer, null, 2));
    
    try {
      const tableData = this.transformToTableData(influencer);
      console.log('Transformed table data:', JSON.stringify(tableData, null, 2));
      
      const requestBody = { item: tableData };
      console.log('BRMH Request URL:', `${this.baseURL}?tableName=${this.tableName}`);
      console.log('BRMH Request Body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${this.baseURL}?tableName=${this.tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('BRMH Response Status:', response.status);
      console.log('BRMH Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('BRMH Error Response:', errorText);
        throw new Error(`Failed to create influencer: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('BRMH Success Response:', JSON.stringify(responseData, null, 2));
      return responseData;
    } catch (error) {
      console.error('BRMH API Error creating influencer:', error);
      throw error;
    }
  }

  // Get all influencers
  async getInfluencers(): Promise<Influencer[]> {
    try {
      console.log('=== BRMH API: GET ALL INFLUENCERS ===');
      console.log('BRMH Request URL:', `${this.baseURL}?tableName=${this.tableName}&pagination=true&itemPerPage=50`);
      
      const response = await fetch(`${this.baseURL}?tableName=${this.tableName}&pagination=true&itemPerPage=50`);

      console.log('BRMH Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('BRMH Error Response:', errorText);
        throw new Error(`Failed to get influencers: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('BRMH Success Response:', JSON.stringify(responseData, null, 2));
      
      if (responseData.success && responseData.items) {
        // Transform all items from table format to influencer format
        return responseData.items.map((item: any) => this.transformFromTableData(item));
      } else {
        console.log('No items found or invalid response format');
        return [];
      }
    } catch (error) {
      console.error('Error getting influencers:', error);
      throw error;
    }
  }

  // Get specific influencer
  async getInfluencer(id: string): Promise<Influencer> {
    try {
      console.log('=== BRMH API: GET INFLUENCER ===');
      console.log('BRMH Request URL:', `${this.baseURL}?tableName=${this.tableName}&id=${id}`);
      
      const response = await fetch(`${this.baseURL}?tableName=${this.tableName}&id=${id}`);

      console.log('BRMH Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('BRMH Error Response:', errorText);
        throw new Error(`Failed to get influencer: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('BRMH Success Response:', JSON.stringify(responseData, null, 2));
      
      if (responseData.success && responseData.item) {
        return this.transformFromTableData(responseData.item);
      } else {
        throw new Error('Influencer not found');
      }
    } catch (error) {
      console.error('Error getting influencer:', error);
      throw error;
    }
  }

  // Update influencer
  async updateInfluencer(id: string, data: Partial<Influencer>): Promise<{ success: boolean }> {
    try {
      console.log('=== BRMH API: UPDATE INFLUENCER ===');
      console.log('BRMH Request URL:', `${this.baseURL}?tableName=${this.tableName}`);
      
      // Build partial update payload ONLY for provided fields to avoid wiping data
      const partialUpdates: any = {};
      if (data.name !== undefined) partialUpdates.name = data.name;
      if (data.email !== undefined) partialUpdates.email = data.email;
      if (data.phone !== undefined) partialUpdates.phone = data.phone ?? '';
      if (data.address !== undefined) partialUpdates.data = { address: data.address ?? '' };
      if (data.status !== undefined) partialUpdates.role = data.status;
      if (data.categories !== undefined) partialUpdates.teamId = data.categories ? JSON.stringify(data.categories) : '';
      if (data.socialMedia !== undefined) partialUpdates.companyId = data.socialMedia ? JSON.stringify(data.socialMedia) : '';
      if (data.createdAt !== undefined) partialUpdates.createdAt = data.createdAt;
      // Always bump updatedAt
      partialUpdates.updatedAt = (data.updatedAt ?? new Date().toISOString());

      const requestBody = {
        key: { id: id },
        updates: partialUpdates
      };
      
      console.log('BRMH Request Body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${this.baseURL}?tableName=${this.tableName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('BRMH Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('BRMH Error Response:', errorText);
        throw new Error(`Failed to update influencer: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('BRMH Success Response:', JSON.stringify(responseData, null, 2));
      return responseData;
    } catch (error) {
      console.error('Error updating influencer:', error);
      throw error;
    }
  }

  // Delete influencer
  async deleteInfluencer(id: string): Promise<{ success: boolean }> {
    try {
      console.log('=== BRMH API: DELETE INFLUENCER ===');
      console.log('BRMH Request URL:', `${this.baseURL}?tableName=${this.tableName}`);
      
      const requestBody = { id: id };
      console.log('BRMH Request Body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${this.baseURL}?tableName=${this.tableName}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('BRMH Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('BRMH Error Response:', errorText);
        throw new Error(`Failed to delete influencer: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('BRMH Success Response:', JSON.stringify(responseData, null, 2));
      return responseData;
    } catch (error) {
      console.error('Error deleting influencer:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/test`);
      return response.ok;
    } catch (error) {
      console.error('BRMH connection test failed:', error);
      return false;
    }
  }
}
