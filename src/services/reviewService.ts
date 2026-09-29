import {
  ReviewRepository,
  type CreateReviewInput,
  type FindAllParams,
} from "../repositories/reviewRepository.ts";
import type {
  ReviewResponseDto,
  ReviewCreateRequestDto,
} from "../dtos/reviewDto.ts";
import { StallRepository } from "../repositories/stallRepository.ts";
import { UserRepository } from "../repositories/userRepository.ts";

type ReviewRowFromList = Awaited<ReturnType<ReviewRepository["findAll"]>>["rows"][number];

export class ReviewService {
  private reviewRepository: ReviewRepository;
  private stallRepository: StallRepository;
  private userRepository: UserRepository;

  constructor(
    reviewRepository: ReviewRepository = new ReviewRepository(),
    stallRepository: StallRepository = new StallRepository(),
    userRepository: UserRepository = new UserRepository(),
  ) {
    this.reviewRepository = reviewRepository;
    this.stallRepository = stallRepository;
    this.userRepository = userRepository;
  }

  private toDto(row: ReviewRowFromList): ReviewResponseDto {
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

  async getAllReviews(params: FindAllParams) {
    const { rows, total } = await this.reviewRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async getReviewById(id: number): Promise<ReviewResponseDto> {
    const row = await this.reviewRepository.findById(id);
    if (!row) throw new Error("REVIEW_NOT_FOUND");
    return this.toDto(row);
  }

  async createReview(
    input: ReviewCreateRequestDto,
  ): Promise<ReviewResponseDto> {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new Error("INVALID_RATING");
    }

    const stall = await this.stallRepository.findById(input.stallId);
    if (!stall) throw new Error("STALL_NOT_FOUND");

    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    const createInput: CreateReviewInput = {
      stallId: input.stallId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment,
    };

    const row = await this.reviewRepository.create(createInput);
    if (!row) throw new Error("REVIEW_CREATE_FAILED");

    const createdReview = await this.reviewRepository.findById(row.id);
    if (!createdReview) throw new Error("REVIEW_NOT_FOUND");
    return this.toDto(createdReview);
  }

  async deleteReview(id: number): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new Error("REVIEW_NOT_FOUND");

    const row = await this.reviewRepository.remove(id);
    if (!row) throw new Error("REVIEW_NOT_FOUND");
    return this.toDto(review);
  }
}
