import type { Request, Response } from 'express';
import { MenuItemService } from '../services/menuItemService.ts';
import { normalizePagination } from '../utils/paginationHelper.ts';

export class MenuItemController {
  private menuItemService: MenuItemService;

  constructor(menuItemService: MenuItemService = new MenuItemService()) {
    this.menuItemService = menuItemService;
  }

  private handleError(res: Response, error: unknown): Response {
    if (error instanceof Error && error.message === 'MENU_ITEM_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Menu item tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
      return res.status(404).json({ status: 'fail', message: 'Warung tidak ditemukan' });
    }
    if (error instanceof Error && error.message === 'INVALID_PRICE') {
      return res.status(400).json({ status: 'fail', message: 'Harga harus lebih besar dari 0' });
    }
    if (error instanceof Error && error.message === 'INVALID_NAME') {
      return res.status(400).json({ status: 'fail', message: 'Nama menu item tidak boleh kosong' });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  getMenuItems = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { page, limit } = normalizePagination(req.query.page, req.query.limit);
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const stallId = typeof req.query.stallId === 'string' ? Number(req.query.stallId) : undefined;

      const { data, total } = await this.menuItemService.getAllMenuItems({
        search,
        stallId,
        page,
        limit,
      });

      return res.status(200).json({ status: 'success', meta: { page, limit, total }, data });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getMenuItemById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const menuItem = await this.menuItemService.getMenuItemById(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: menuItem });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  createMenuItem = async (req: Request, res: Response): Promise<Response> => {
    try {
      const menuItem = await this.menuItemService.createMenuItem(req.body);
      return res.status(201).json({ status: 'success', data: menuItem });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  updateMenuItem = async (req: Request, res: Response): Promise<Response> => {
    try {
      const menuItem = await this.menuItemService.updateMenuItem(Number(req.params.id), req.body);
      return res.status(200).json({ status: 'success', data: menuItem });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  deleteMenuItem = async (req: Request, res: Response): Promise<Response> => {
    try {
      const menuItem = await this.menuItemService.deleteMenuItem(Number(req.params.id));
      return res.status(200).json({ status: 'success', data: menuItem });
    } catch (error) {
      return this.handleError(res, error);
    }
  };
}
