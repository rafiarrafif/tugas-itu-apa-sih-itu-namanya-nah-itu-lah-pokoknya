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
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ status: 'fail', message: 'Email atau password salah' });
    }
    if (error instanceof Error && error.message === 'INVALID_TOKEN') {
      return res.status(401).json({ status: 'fail', message: 'Token tidak valid' });
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

  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = req.body;
      const result = await this.userService.login(email, password);
      return res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  me = async (req: Request, res: Response): Promise<Response> => {
    try {
      const token = req.headers.auth_token;
      if (typeof token !== 'string' || token.length === 0) {
        throw new Error('INVALID_TOKEN');
      }

      const payload = this.userService.verifyToken(token);
      return res.status(201).json({
        status: 'success',
        message: 'Token valid',
        data: payload,
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
