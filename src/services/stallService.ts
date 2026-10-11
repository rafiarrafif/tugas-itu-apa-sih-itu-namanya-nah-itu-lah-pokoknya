import {
  StallRepository,
  type CreateStallInput,
  type FindAllParams,
} from "../repositories/stallRepository.ts";
import { MenuItemRepository } from "../repositories/menuItemRepository.ts";
import { UserRepository } from "../repositories/userRepository.ts";
import { ReviewRepository } from "../repositories/reviewRepository.ts";
import type { MenuItemDto, StallResponseDto } from "../dtos/stallDto.ts";
import type { ReviewResponseDto } from "../dtos/reviewDto.ts";

type StallRowFromList = Awaited<ReturnType<StallRepository["findAll"]>>["rows"][number];
type StallRowFromFind = Awaited<ReturnType<StallRepository["findById"]>>;
type ReviewRowFromList = Awaited<ReturnType<ReviewRepository["findAll"]>>["rows"][number];

export class StallService {
  private stallRepository: StallRepository;
  private menuItemRepository: MenuItemRepository;
  private userRepository: UserRepository;
  private reviewRepository: ReviewRepository;

  constructor(
    stallRepository: StallRepository = new StallRepository(),
    menuItemRepository: MenuItemRepository = new MenuItemRepository(),
    userRepository: UserRepository = new UserRepository(),
    reviewRepository: ReviewRepository = new ReviewRepository(),
  ) {
    this.stallRepository = stallRepository;
    this.menuItemRepository = menuItemRepository;
    this.userRepository = userRepository;
    this.reviewRepository = reviewRepository;
  }

  private toDto(row: StallRowFromList | NonNullable<StallRowFromFind>): StallResponseDto {
    const avgRating = Number(row.avgRating);
    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      category: row.category,
      location: row.location,
      description: row.description,
      avgRating,
      reviewCount: row.reviewCount,
      isPopular: avgRating >= 4.7,
    };
  }

  private reviewToDto(row: ReviewRowFromList): ReviewResponseDto {
    return {
      id: row.id,
      stallId: row.stallId,
      userId: row.userId,
      rating: row.rating,
      comment: row.comment,
      likeCount: row.likeCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      stall: row.stall
        ? {
            id: row.stall.id,
            name: row.stall.name,
            category: row.stall.category,
          }
        : undefined,
      user: row.user
        ? {
            id: row.user.id,
            name: row.user.name,
            email: row.user.email,
          }
        : undefined,
    };
  }

  async getAllStalls(params: FindAllParams) {
    const { rows, total } = await this.stallRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async getStallById(id: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new Error("STALL_NOT_FOUND");
    return this.toDto(row);
  }

  async getStallMenus(id: number): Promise<MenuItemDto[]> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new Error("STALL_NOT_FOUND");
    return this.menuItemRepository.findByStallId(id);
  }

  async getStallReviews(stallId: number, page: number, limit: number) {
    // Verify stall exists
    const stall = await this.stallRepository.findById(stallId);
    if (!stall) throw new Error("STALL_NOT_FOUND");

    // Fetch reviews for this stall
    const { rows, total } = await this.reviewRepository.findAll({
      stallId,
      page,
      limit,
    });

    return { data: rows.map((row) => this.reviewToDto(row)), total };
  }

  async createStall(input: CreateStallInput): Promise<StallResponseDto> {
    const owner = await this.userRepository.findById(input.ownerId);
    if (!owner) throw new Error("OWNER_NOT_FOUND");

    const row = await this.stallRepository.create(input);
    if (!row) throw new Error("STALL_CREATE_FAILED");
    return this.toDto(row);
  }

  async updateStall(
    id: number,
    input: Partial<CreateStallInput>,
  ): Promise<StallResponseDto> {
    const row = await this.stallRepository.update(id, input);
    if (!row) throw new Error("STALL_NOT_FOUND");
    return this.toDto(row);
  }

  async deleteStall(id: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.remove(id);
    if (!row) throw new Error("STALL_NOT_FOUND");
    return this.toDto(row);
  }
}
