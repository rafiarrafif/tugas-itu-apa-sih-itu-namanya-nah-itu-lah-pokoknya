import {
  UserRepository,
  type CreateUserInput,
  type FindAllParams,
} from "../repositories/userRepository.ts";
import type { UserResponseDto, UserCreateRequestDto } from "../dtos/userDto.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

type UserRow = Awaited<ReturnType<UserRepository["findAll"]>>["rows"][number];

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
      role: row.role as "admin" | "owner" | "customer",
      createdAt: row.createdAt,
    };
  }

  async getAllUsers(params: FindAllParams) {
    const { rows, total } = await this.userRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async createUser(input: UserCreateRequestDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) throw new Error("EMAIL_ALREADY_EXISTS");

    const createInput: CreateUserInput = {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    };

    const row = await this.userRepository.create(createInput);
    if (!row) throw new Error("USER_CREATE_FAILED");
    return this.toDto(row);
  }

  async login(email: string, password: string) {
    if (typeof email !== "string" || typeof password !== "string") {
      throw new Error("INVALID_CREDENTIALS");
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET ?? "development-secret",
      { expiresIn: "1d" },
    );

    return {
      token,
      user: this.toDto(user),
    };
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(
        token,
        process.env.JWT_SECRET ?? "development-secret",
      );
    } catch {
      throw new Error("INVALID_TOKEN");
    }
  }
}
