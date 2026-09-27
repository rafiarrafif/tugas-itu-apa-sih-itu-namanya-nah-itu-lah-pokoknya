import type { Request, Response } from 'express';
import { UserService } from '../services/userService.ts';
import { normalizePagination } from '../utils/paginationHelper.ts';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService = new UserService()) {
    this.userService = userService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({ status: 'fail', message: 'Email sudah terdaftar' });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { page, limit } = normalizePagination(req.query.page, req.query.limit);
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const role = typeof req.query.role === 'string' ? req.query.role : undefined;

      const { data, total } = await this.userService.getAllUsers({
        search,
        role,
        page,
        limit,
      });

      return res.status(200).json({ status: 'success', meta: { page, limit, total }, data });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createUser = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = await this.userService.createUser(req.body);
      return res.status(201).json({ status: 'success', data: user });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
