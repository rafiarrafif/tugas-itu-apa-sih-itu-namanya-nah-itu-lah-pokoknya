import {
  MenuItemRepository,
  type CreateMenuItemInput,
  type FindAllParams,
  type UpdateMenuItemInput,
} from '../repositories/menuItemRepository.ts';
import type {
  MenuItemResponseDto,
  MenuItemCreateRequestDto,
  MenuItemUpdateRequestDto,
} from '../dtos/menuItemDto.ts';
import { StallRepository } from '../repositories/stallRepository.ts';

type MenuItemRow = NonNullable<Awaited<ReturnType<MenuItemRepository['findAll']>>['rows'][number]>;
type MenuItemRowWithoutStall = NonNullable<Awaited<ReturnType<MenuItemRepository['findByIdSimple']>>>;

export class MenuItemService {
  private menuItemRepository: MenuItemRepository;
  private stallRepository: StallRepository;

  constructor(
    menuItemRepository: MenuItemRepository = new MenuItemRepository(),
    stallRepository: StallRepository = new StallRepository()
  ) {
    this.menuItemRepository = menuItemRepository;
    this.stallRepository = stallRepository;
  }

  private toDto(row: MenuItemRow): MenuItemResponseDto {
    return {
      id: row.id,
      stallId: row.stallId,
      name: row.name,
      price: row.price,
      isAvailable: Boolean(row.isAvailable),
      stall: row.stall
        ? {
            id: row.stall.id,
            name: row.stall.name,
            category: row.stall.category,
            location: row.stall.location,
          }
        : undefined,
    };
  }

  private toDtoSimple(row: MenuItemRowWithoutStall): Omit<MenuItemResponseDto, 'stall'> {
    return {
      id: row.id,
      stallId: row.stallId,
      name: row.name,
      price: row.price,
      isAvailable: Boolean(row.isAvailable),
    };
  }

  async getAllMenuItems(params: FindAllParams) {
    const { rows, total } = await this.menuItemRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async getMenuItemById(id: number): Promise<MenuItemResponseDto> {
    const row = await this.menuItemRepository.findById(id);
    if (!row) throw new Error('MENU_ITEM_NOT_FOUND');
    return this.toDto(row);
  }

  async createMenuItem(input: MenuItemCreateRequestDto): Promise<MenuItemResponseDto> {
    // Validasi stall exists
    const stall = await this.stallRepository.findById(input.stallId);
    if (!stall) throw new Error('STALL_NOT_FOUND');

    // Validasi price > 0
    if (!input.price || input.price <= 0) throw new Error('INVALID_PRICE');

    // Validasi name tidak kosong
    if (!input.name || input.name.trim().length === 0) throw new Error('INVALID_NAME');

    const createInput: CreateMenuItemInput = {
      stallId: input.stallId,
      name: input.name,
      price: input.price,
      isAvailable: input.isAvailable,
    };

    const row = await this.menuItemRepository.create(createInput);
    if (!row) throw new Error('MENU_ITEM_CREATE_FAILED');

    const createdItem = await this.menuItemRepository.findById(row.id);
    if (!createdItem) throw new Error('MENU_ITEM_NOT_FOUND');
    return this.toDto(createdItem);
  }

  async updateMenuItem(id: number, input: MenuItemUpdateRequestDto): Promise<MenuItemResponseDto> {
    const item = await this.menuItemRepository.findById(id);
    if (!item) throw new Error('MENU_ITEM_NOT_FOUND');

    const updateInput: UpdateMenuItemInput = {
      name: input.name,
      price: input.price,
      isAvailable: input.isAvailable,
    };

    const row = await this.menuItemRepository.update(id, updateInput);
    if (!row) throw new Error('MENU_ITEM_NOT_FOUND');

    const updatedItem = await this.menuItemRepository.findById(id);
    if (!updatedItem) throw new Error('MENU_ITEM_NOT_FOUND');
    return this.toDto(updatedItem);
  }

  async deleteMenuItem(id: number): Promise<MenuItemResponseDto> {
    const item = await this.menuItemRepository.findById(id);
    if (!item) throw new Error('MENU_ITEM_NOT_FOUND');

    const row = await this.menuItemRepository.remove(id);
    if (!row) throw new Error('MENU_ITEM_NOT_FOUND');
    return this.toDto(item);
  }
}
