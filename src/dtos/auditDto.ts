export interface AuditResponseDto {
  id: number;
  userId: number;
  action: string; // 'CREATE', 'UPDATE', 'DELETE'
  targetTable: string;
  targetId: number;
  metadata?: string;
  createdAt?: Date;
}

export interface AuditCreateRequestDto {
  userId: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  targetTable: string;
  targetId: number;
  metadata?: string;
}
