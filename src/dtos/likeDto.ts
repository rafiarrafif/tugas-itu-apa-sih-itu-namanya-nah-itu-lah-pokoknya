export interface LikeResponseDto {
  id: number;
  reviewId: number;
  userId: number;
  createdAt: Date | null;
}

export interface LikeCreateRequestDto {
  reviewId: number;
  userId: number;
}
