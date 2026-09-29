import { Router } from 'express';
import { MenuItemController } from '../controllers/menuItemController.ts';

const menuItemRouter = Router();
const menuItemController = new MenuItemController();

menuItemRouter.get('/', (req, res) => {
  // #swagger.parameters['search'] = { in: 'query', type: 'string' }
  // #swagger.parameters['stallId'] = { in: 'query', type: 'integer' }
  // #swagger.parameters['page'] = { in: 'query', type: 'integer' }
  // #swagger.parameters['limit'] = { in: 'query', type: 'integer' }
  // #swagger.responses[200] = { description: 'Daftar menu items dengan JOIN stall' }
  return menuItemController.getMenuItems(req, res);
});

menuItemRouter.post('/', (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/MenuItemInput' } }
  // #swagger.responses[201] = { description: 'Menu item dibuat' }
  // #swagger.responses[404] = { description: 'Warung tidak ditemukan' }
  return menuItemController.createMenuItem(req, res);
});

menuItemRouter.get('/:id', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Detail menu item dengan JOIN stall' }
  // #swagger.responses[404] = { description: 'Menu item tidak ditemukan' }
  return menuItemController.getMenuItemById(req, res);
});

menuItemRouter.put('/:id', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.parameters['body'] = { in: 'body', required: false, schema: { $ref: '#/definitions/MenuItemUpdate' } }
  // #swagger.responses[200] = { description: 'Menu item ter-update' }
  // #swagger.responses[404] = { description: 'Menu item tidak ditemukan' }
  return menuItemController.updateMenuItem(req, res);
});

menuItemRouter.delete('/:id', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Menu item terhapus' }
  // #swagger.responses[404] = { description: 'Menu item tidak ditemukan' }
  return menuItemController.deleteMenuItem(req, res);
});

export { menuItemRouter };
