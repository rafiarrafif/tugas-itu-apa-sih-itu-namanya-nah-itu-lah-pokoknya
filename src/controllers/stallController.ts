import type { Request, Response } from 'express';
import { StallService } from '../services/stallService.ts';

export class StallController {
  private stallService: StallService;

  constructor(stallService: StallService = new StallService()) {
    this.stallService = stallService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'INVALID_ID') {
      return res.status(400).json({ status: 'fail', message: 'ID harus berupa angka positif' });
    }
    if (error instanceof Error && error.message === 'INVALID_SEARCH') {
      return res.status(400).json({ status: 'fail', message: 'Search parameter tidak boleh lebih dari 100 karakter' });
    }
    if (error instanceof Error && error.message === 'INVALID_CATEGORY') {
      return res.status(400).json({ status: 'fail', message: 'Category parameter tidak boleh lebih dari 50 karakter' });
    }
    if (error instanceof Error && error.message === 'INVALID_NAME') {
      return res.status(400).json({ status: 'fail', message: 'Nama warung harus berisi 3-100 karakter' });
    }
    if (error instanceof Error && error.message === 'INVALID_STALL_CATEGORY') {
      return res.status(400).json({ status: 'fail', message: 'Kategori tidak boleh lebih dari 50 karakter' });
    }
    if (error instanceof Error && error.message === 'INVALID_LOCATION') {
      return res.status(400).json({ status: 'fail', message: 'Lokasi tidak boleh lebih dari 100 karakter' });
    }
    if (error instanceof Error && error.message === 'INVALID_DESCRIPTION') {
      return res.status(400).json({ status: 'fail', message: 'Deskripsi tidak boleh lebih dari 1000 karakter' });
    }
    if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Data warung tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'OWNER_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Pemilik warung tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'STALL_CREATE_FAILED') {
      return res.status(500).json({ status: 'error', message: 'Gagal membuat warung' });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getStalls = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Validate and normalize pagination parameters
      const { page, limit } = this.validateAndNormalizePagination(req.query.page, req.query.limit);
      
      // Validate and normalize string query parameters
      const search = this.validateSearch(req.query.search);
      const category = this.validateCategory(req.query.category);

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

  private validateAndNormalizePagination(page: any, limit: any): { page: number; limit: number } {
    let p = Math.max(1, Math.floor(Number(page) || 1));
    let l = Math.max(1, Math.min(Math.floor(Number(limit) || 10), 100)); // Max 100 per requirements
    return { page: p, limit: l };
  }

  private validateSearch(search: any): string | undefined {
    if (search === undefined || search === null || search === '') return undefined;
    if (typeof search !== 'string') return undefined;
    
    const trimmed = search.trim();
    if (trimmed.length === 0) return undefined;
    if (trimmed.length > 100) {
      throw new Error('INVALID_SEARCH');
    }
    
    return trimmed;
  }

  private validateCategory(category: any): string | undefined {
    if (category === undefined || category === null || category === '') return undefined;
    if (typeof category !== 'string') return undefined;
    
    const trimmed = category.trim();
    if (trimmed.length === 0) return undefined;
    if (trimmed.length > 50) {
      throw new Error('INVALID_CATEGORY');
    }
    
    return trimmed;
  }

  getStallById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = this.validateId(req.params.id);
      const stall = await this.stallService.getStallById(id);
      return res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getStallMenus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = this.validateId(req.params.id);
      const menus = await this.stallService.getStallMenus(id);
      return res.status(200).json({ status: 'success', data: menus });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getStallReviews = async (req: Request, res: Response): Promise<Response> => {
    try {
      const stallId = this.validateId(req.params.id);
      const { page, limit } = this.validateAndNormalizePagination(req.query.page, req.query.limit);

      const { data, total } = await this.stallService.getStallReviews(stallId, page, limit);
      return res.status(200).json({ status: 'success', meta: { page, limit, total }, data });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createStall = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Validate request body
      const validatedBody = this.validateCreateStallBody(req.body);
      const stall = await this.stallService.createStall({
        ...validatedBody,
        ownerId: req.userId as number,
      });
      return res.status(201).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  updateStall = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = this.validateId(req.params.id);
      const stall = await this.stallService.updateStall(id, req.body);
      return res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  deleteStall = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = this.validateId(req.params.id);
      const stall = await this.stallService.deleteStall(id);
      return res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  private validateId(id: any): number {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new Error('INVALID_ID');
    }
    return parsedId;
  }

  private validateCreateStallBody(body: any): any {
    // Validate name (required, 3-100 chars, trimmed)
    if (!body.name || typeof body.name !== 'string') {
      throw new Error('INVALID_NAME');
    }
    const trimmedName = body.name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 100) {
      throw new Error('INVALID_NAME');
    }

    // Validate category (optional, max 50 chars, trimmed)
    let validatedCategory: string | null = null;
    if (body.category !== undefined && body.category !== null && body.category !== '') {
      if (typeof body.category !== 'string') {
        throw new Error('INVALID_STALL_CATEGORY');
      }
      const trimmedCategory = body.category.trim();
      if (trimmedCategory.length === 0) {
        validatedCategory = null;
      } else if (trimmedCategory.length > 50) {
        throw new Error('INVALID_STALL_CATEGORY');
      } else {
        validatedCategory = trimmedCategory;
      }
    }

    // Validate location (optional, max 100 chars)
    let validatedLocation: string | null = null;
    if (body.location !== undefined && body.location !== null && body.location !== '') {
      if (typeof body.location !== 'string') {
        throw new Error('INVALID_LOCATION');
      }
      const trimmedLocation = body.location.trim();
      if (trimmedLocation.length === 0) {
        validatedLocation = null;
      } else if (trimmedLocation.length > 100) {
        throw new Error('INVALID_LOCATION');
      } else {
        validatedLocation = trimmedLocation;
      }
    }

    // Validate description (optional, max 1000 chars)
    let validatedDescription: string | null = null;
    if (body.description !== undefined && body.description !== null && body.description !== '') {
      if (typeof body.description !== 'string') {
        throw new Error('INVALID_DESCRIPTION');
      }
      const trimmedDescription = body.description.trim();
      if (trimmedDescription.length === 0) {
        validatedDescription = null;
      } else if (trimmedDescription.length > 1000) {
        throw new Error('INVALID_DESCRIPTION');
      } else {
        validatedDescription = trimmedDescription;
      }
    }

    return {
      ...body,
      name: trimmedName,
      category: validatedCategory,
      location: validatedLocation,
      description: validatedDescription,
    };
  }
}
