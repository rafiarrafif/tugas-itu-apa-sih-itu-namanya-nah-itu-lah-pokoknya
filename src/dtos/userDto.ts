export interface UserResponseDto {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'customer';
  createdAt: Date | null;
}

export interface UserCreateRequestDto {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'owner' | 'customer';
}
