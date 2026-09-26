import type { Request, Response } from 'express';
import { AuditService } from '../services/auditService.ts';

export class AuditController {
  private auditService: AuditService;

  constructor(auditService: AuditService = new AuditService()) {
    this.auditService = auditService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'INVALID_ACTION') {
      return res.status(400).json({
        status: 'fail',
        message: 'Action tidak valid. Gunakan: CREATE, UPDATE, DELETE',
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getAuditLogs = async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const action = typeof req.query.action === 'string' ? req.query.action : undefined;
      const targetTable = typeof req.query.targetTable === 'string' ? req.query.targetTable : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;

      const { data, total } = await this.auditService.getAllAuditLogs({
        userId,
        action,
        targetTable,
        search,
        page,
        limit,
      });

      return res.status(200).json({ status: 'success', meta: { page, limit, total }, data });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createAuditLog = async (req: Request, res: Response): Promise<Response> => {
    try {
      const auditLog = await this.auditService.createAuditLog(req.body);
      return res.status(201).json({ status: 'success', data: auditLog });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
