import type { Request, Response } from 'express';
import { ReviewService } from '../services/reviewService.ts';

export class ReviewController {
  private reviewService: ReviewService;

  constructor(reviewService: ReviewService = new ReviewService()) {
    this.reviewService = reviewService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'REVIEW_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Review tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Warung tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'User tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'INVALID_RATING') {
      return res.status(400).json({ status: 'fail', message: 'Rating harus antara 1-5' });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getReviews = async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const stallId = typeof req.query.stallId === 'string' ? Number(req.query.stallId) : undefined;
      const userId = typeof req.query.userId === 'string' ? Number(req.query.userId) : undefined;

      const { data, total } = await this.reviewService.getAllReviews({
        search,
        stallId,
        userId,
        page,
        limit,
      });

      return res.status(200).json({ status: 'success', meta: { page, limit, total }, data });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createReview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const review = await this.reviewService.createReview(req.body);
      return res.status(201).json({ status: 'success', data: review });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  deleteReview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const review = await this.reviewService.deleteReview(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: review });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
