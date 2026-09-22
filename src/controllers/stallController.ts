import type { Request, Response } from 'express';
import { StallService } from '../services/stallService.ts';

export class StallController {
  private stallService: StallService;

  constructor(stallService: StallService = new StallService()) {
    this.stallService = stallService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data warung tidak ditemukan' });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getStalls = async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;

      const { data, total } = await this.stallService.getAllStalls({
        search,
        category,
        page,
        limit,
      });

      return res.status(200).json({ status: 'success', meta: { page, limit, total }, data });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getStallById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const stall = await this.stallService.getStallById(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getStallMenus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const menus = await this.stallService.getStallMenus(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: menus });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createStall = async (req: Request, res: Response): Promise<Response> => {
    try {
      const stall = await this.stallService.createStall(req.body);
      return res.status(201).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  updateStall = async (req: Request, res: Response): Promise<Response> => {
    try {
      const stall = await this.stallService.updateStall(Number(req.params.id), req.body);
      return res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  deleteStall = async (req: Request, res: Response): Promise<Response> => {
    try {
      const stall = await this.stallService.deleteStall(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
