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
    if (error instanceof Error && error.message === 'AUDIT_LOG_NOT_FOUND') {
      return res.status(404).json({
        status: 'fail',
        message: 'Audit log tidak ditemukan',
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  createAuditLog = async (req: Request, res: Response): Promise<Response> => {
    try {
      const auditLog = await this.auditService.createAuditLog(req.body);
      return res.status(201).json({ status: 'success', data: auditLog });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getAuditLogById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const auditLog = await this.auditService.getAuditLogById(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: auditLog });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
