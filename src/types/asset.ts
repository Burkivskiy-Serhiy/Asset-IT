export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'missing';
export type AssetType = 'hardware' | 'network' | 'software';
export interface Asset {
  id: string;
  name: string;          
  type: AssetType;       
  status: AssetStatus;
  owner: string;         
  location: string;
  purchaseDate: string;
  serialNumber?: string; 
}