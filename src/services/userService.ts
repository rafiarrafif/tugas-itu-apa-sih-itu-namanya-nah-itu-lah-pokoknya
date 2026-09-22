import {
  UserRepository,
  type CreateUserInput,
  type FindAllParams,
} from '../repositories/userRepository.ts';
import type { UserResponseDto, UserCreateRequestDto } from '../dtos/userDto.ts';

type UserRow = NonNullable<Awaited<ReturnType<UserRepository['findAll']>>['rows'][number]>;

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  private toDto(row: UserRow): UserResponseDto {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as 'admin' | 'owner' | 'customer',
      createdAt: row.createdAt,
    };
  }

  async getAllUsers(params: FindAllParams) {
    const { rows, total } = await this.userRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async createUser(input: UserCreateRequestDto): Promise<UserResponseDto> {
    // Validasi email belum terdaftar
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) throw new Error('EMAIL_ALREADY_EXISTS');

    const createInput: CreateUserInput = {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    };

    const row = await this.userRepository.create(createInput);
    if (!row) throw new Error('USER_CREATE_FAILED');
    return this.toDto(row);
  }
}
