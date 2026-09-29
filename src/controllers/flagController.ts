import type { Request, Response } from 'express';
import { FlagService } from '../services/flagService.ts';
import { normalizePagination } from '../utils/paginationHelper.ts';

export class FlagController {
  private flagService: FlagService;

  constructor(flagService: FlagService = new FlagService()) {
    this.flagService = flagService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'FLAG_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data bendera laporan tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'INVALID_STATUS') {
      return res.status(400).json({ status: 'fail', message: 'Status tidak valid. Gunakan: pending, reviewed, resolved, dismissed' });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getFlags = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { page, limit } = normalizePagination(req.query.page, req.query.limit);
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;

      const { data, total } = await this.flagService.getAllFlags({
        status,
        search,
        page,
        limit,
      });

      return res.status(200).json({ status: 'success', meta: { page, limit, total }, data });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getFlagById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const flag = await this.flagService.getFlagById(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: flag });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  updateFlag = async (req: Request, res: Response): Promise<Response> => {
    try {
      const flag = await this.flagService.updateFlagStatus(Number(req.params.id), req.body);
      return res.status(200).json({ status: 'success', data: flag });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
