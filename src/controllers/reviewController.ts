import type { Request, Response } from "express";
import { ReviewService } from "../services/reviewService.ts";
import { normalizePagination } from "../utils/paginationHelper.ts";

export class ReviewController {
  private reviewService: ReviewService;

  constructor(reviewService: ReviewService = new ReviewService()) {
    this.reviewService = reviewService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === "INVALID_ID") {
      return res
        .status(400)
        .json({ status: "fail", message: "ID harus berupa angka positif" });
    }
    if (error instanceof Error && error.message === "REVIEW_NOT_FOUND") {
      return res
        .status(404)
        .json({ status: "fail", message: "Review tidak ditemukan" });
    }
    if (error instanceof Error && error.message === "STALL_NOT_FOUND") {
      return res
        .status(404)
        .json({ status: "fail", message: "Warung tidak ditemukan" });
    }
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res
        .status(404)
        .json({ status: "fail", message: "User tidak ditemukan" });
    }
    if (error instanceof Error && error.message === "INVALID_RATING") {
      return res
        .status(400)
        .json({ status: "fail", message: "Rating harus antara 1-5" });
    }
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getReviews = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { page, limit } = normalizePagination(
        req.query.page,
        req.query.limit,
      );
      const search =
        typeof req.query.search === "string" ? req.query.search : undefined;
      const stallId =
        typeof req.query.stallId === "string"
          ? Number(req.query.stallId)
          : undefined;
      const userId =
        typeof req.query.userId === "string"
          ? Number(req.query.userId)
          : undefined;

      const { data, total } = await this.reviewService.getAllReviews({
        search,
        stallId,
        userId,
        page,
        limit,
      });

      return res
        .status(200)
        .json({ status: "success", meta: { page, limit, total }, data });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getReviewById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const review = await this.reviewService.getReviewById(
        Number(req.params.id),
      );
      return res.status(200).json({ status: "success", data: review });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getReviewByIdForStall = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const stallId = this.validateId(req.params.stallId);
      const reviewId = this.validateId(req.params.reviewId);

      const review = await this.reviewService.getReviewById(reviewId);

      // Verify review belongs to the specified stall
      if (review.stallId !== stallId) {
        throw new Error("REVIEW_NOT_FOUND");
      }

      return res.status(200).json({ status: "success", data: review });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createReview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const review = await this.reviewService.createReview(req.body);
      return res.status(201).json({ status: "success", data: review });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createReviewForStall = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const stallId = this.validateId(req.params.id);
      const { userId, rating, comment } = req.body;

      const review = await this.reviewService.createReview({
        stallId,
        userId,
        rating,
        comment,
      });
      return res.status(201).json({ status: "success", data: review });
    } catch (error) {
      if (this.isDuplicateReviewError(error)) {
        return res.status(409).json({
          status: "fail",
          message: "User sudah memberikan review untuk warung ini",
        });
      }
      return this.handleError(res, error);
    }
  };

  deleteReview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const review = await this.reviewService.deleteReview(
        Number(req.params.id),
      );
      return res.status(200).json({ status: "success", data: review });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  deleteReviewForStall = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const stallId = this.validateId(req.params.stallId);
      const reviewId = this.validateId(req.params.reviewId);

      const review = await this.reviewService.getReviewById(reviewId);

      // Verify review belongs to the specified stall
      if (review.stallId !== stallId) {
        throw new Error("REVIEW_NOT_FOUND");
      }

      const deletedReview = await this.reviewService.deleteReview(reviewId);
      return res.status(200).json({ status: "success", data: deletedReview });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  private validateId(id: any): number {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new Error("INVALID_ID");
    }
    return parsedId;
  }

  private isDuplicateReviewError(error: unknown): boolean {
    let current: unknown = error;
    while (current instanceof Error) {
      if (
        current.message.includes("UQ_REVIEWS_user_stall") ||
        current.message.includes("duplicate key")
      ) {
        return true;
      }
      current = "cause" in current ? current.cause : undefined;
    }
    return false;
  }
}
