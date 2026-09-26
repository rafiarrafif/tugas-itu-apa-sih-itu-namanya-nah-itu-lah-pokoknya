import {
  LikeRepository,
  type CreateLikeInput,
} from '../repositories/likeRepository.ts';
import type { LikeResponseDto, LikeCreateRequestDto } from '../dtos/likeDto.ts';
import { ReviewRepository } from '../repositories/reviewRepository.ts';
import { UserRepository } from '../repositories/userRepository.ts';
import { getDb } from '../db/index.ts';
import { reviews } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

type LikeRow = NonNullable<Awaited<ReturnType<LikeRepository['findById']>>>;

export class LikeService {
  private likeRepository: LikeRepository;
  private reviewRepository: ReviewRepository;
  private userRepository: UserRepository;

  constructor(
    likeRepository: LikeRepository = new LikeRepository(),
    reviewRepository: ReviewRepository = new ReviewRepository(),
    userRepository: UserRepository = new UserRepository()
  ) {
    this.likeRepository = likeRepository;
    this.reviewRepository = reviewRepository;
    this.userRepository = userRepository;
  }

  private toDto(row: LikeRow): LikeResponseDto {
    return {
      id: row.id,
      reviewId: row.reviewId,
      userId: row.userId,
      createdAt: row.createdAt,
    };
  }

  async createLike(input: LikeCreateRequestDto): Promise<LikeResponseDto> {
    // Validasi review_id harus ada
    const review = await this.reviewRepository.findById(input.reviewId);
    if (!review) throw new Error('REVIEW_NOT_FOUND');

    // Validasi user_id harus ada
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    // Validasi duplicate: 1 user tidak bisa like review 2x
    const existingLike = await this.likeRepository.findByReviewAndUser(
      input.reviewId,
      input.userId
    );
    if (existingLike) throw new Error('LIKE_ALREADY_EXISTS');

    const createInput: CreateLikeInput = {
      reviewId: input.reviewId,
      userId: input.userId,
    };

    const row = await this.likeRepository.create(createInput);
    if (!row) throw new Error('LIKE_CREATE_FAILED');

    // Auto-increment like_count di review
    try {
      const db = await getDb();
      await db
        .update(reviews)
        .set({ likeCount: review.likeCount + 1 })
        .where(eq(reviews.id, input.reviewId));
    } catch (error) {
      // Log error tapi jangan throw - like sudah created, counter bisa update nanti
      console.error('Failed to increment like_count:', error);
    }

    return this.toDto(row);
  }

  async deleteLike(id: number): Promise<LikeResponseDto> {
    const like = await this.likeRepository.findById(id);
    if (!like) throw new Error('LIKE_NOT_FOUND');

    // Get review info sebelum delete untuk decrement like_count
    const review = await this.reviewRepository.findById(like.reviewId);
    if (!review) throw new Error('REVIEW_NOT_FOUND');

    const row = await this.likeRepository.remove(id);
    if (!row) throw new Error('LIKE_NOT_FOUND');

    // Auto-decrement like_count di review
    const db = await getDb();
    await db
      .update(reviews)
      .set({ likeCount: Math.max(0, review.likeCount - 1) })
      .where(eq(reviews.id, like.reviewId));

    return this.toDto(like);
  }
}
