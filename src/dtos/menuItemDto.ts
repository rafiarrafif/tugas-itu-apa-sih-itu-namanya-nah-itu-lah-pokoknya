export interface MenuItemResponseDto {
  id: number;
  stallId: number;
  name: string;
  price: number;
  isAvailable: boolean;
  stall?: {
    id: number;
    name: string;
    category: string | null;
    location: string | null;
  };
}

export interface MenuItemCreateRequestDto {
  stallId: number;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface MenuItemUpdateRequestDto {
  name?: string;
  price?: number;
  isAvailable?: boolean;
}
