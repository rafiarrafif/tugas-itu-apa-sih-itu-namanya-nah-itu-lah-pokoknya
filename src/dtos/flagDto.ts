export interface FlagResponseDto {
  id: number;
  reviewId: number;
  reportedBy: number;
  reason: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date | null;
}

export interface FlagUpdateRequestDto {
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}
