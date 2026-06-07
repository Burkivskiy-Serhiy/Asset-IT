// src/types/asset.ts

export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'missing';
export type AssetType = 'hardware' | 'network' | 'software';

export interface Asset {
  id: string;
  name: string;          // Назва активу (замість assetTag)
  type: AssetType;       // Тип (замість category)
  status: AssetStatus;
  owner: string;         // Власник
  location: string;
  purchaseDate: string;
  serialNumber?: string; // Опціональний серійний номер
}