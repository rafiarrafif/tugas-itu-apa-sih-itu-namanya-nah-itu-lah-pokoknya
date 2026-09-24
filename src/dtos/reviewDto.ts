export interface ReviewResponseDto {
  id: number;
  stallId: number;
  userId: number;
  rating: number;
  comment: string | null;
  likeCount: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  stall?: {
    id: number;
    name: string;
    category: string | null;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ReviewCreateRequestDto {
  stallId: number;
  userId: number;
  rating: number;
  comment?: string;
}
