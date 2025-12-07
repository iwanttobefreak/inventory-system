export interface Item {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: Category;
  categoryId: string;
  status: ItemStatus;
  location?: Location;
  locationId?: string;
  shelf?: Shelf;
  shelfId?: string; // Estantería (segundo nivel)
  purchaseDate?: string;
  purchaseValue?: number;
  brand?: string;
  model?: string;
  serialNumber?: string;
  notes?: string;
  imageUrl?: string;
  qrCodeUrl?: string;
  attributes?: any; // JSON con atributos personalizados (sublocation, etc)
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  _count?: {
    items: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Shelf {
  id: string;
  locationId: string;
  code: string; // ES-XXXX
  name: string;
  description?: string;
  order: number;
  location?: Location;
  sublocations?: LocationAttribute[];
  createdAt: string;
  updatedAt: string;
}

export interface LocationAttribute {
  id: string;
  locationId: string;
  shelfId?: string; // Opcional: si pertenece a una estantería
  code: string;
  name: string;
  description?: string;
  order: number;
  shelf?: Shelf;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  _count?: {
    items: number;
  };
}

export type ItemStatus = 
  | 'AVAILABLE' 
  | 'IN_USE' 
  | 'MAINTENANCE' 
  | 'REPAIR' 
  | 'LOST' 
  | 'RETIRED';

export const STATUS_LABELS: Record<ItemStatus, string> = {
  AVAILABLE: 'Disponible',
  IN_USE: 'En uso',
  MAINTENANCE: 'Mantenimiento',
  REPAIR: 'Reparación',
  LOST: 'Perdido',
  RETIRED: 'Dado de baja',
};

export const STATUS_COLORS: Record<ItemStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  IN_USE: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  REPAIR: 'bg-orange-100 text-orange-800',
  LOST: 'bg-red-100 text-red-800',
  RETIRED: 'bg-gray-100 text-gray-800',
};
