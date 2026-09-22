export interface StallResponseDto {
  id: number;
  ownerId: number;
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
  avgRating: number;
  reviewCount: number;
  isPopular: boolean;
}

export interface MenuItemDto {
  id: number;
  stallId: number;
  name: string;
  price: number;
  isAvailable: boolean;
}
