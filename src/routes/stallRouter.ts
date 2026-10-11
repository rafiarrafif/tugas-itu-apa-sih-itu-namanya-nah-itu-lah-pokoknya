import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';

const stallRouter = Router();
const stallController = new StallController();

stallRouter.get('/', (req, res) => {
  // #swagger.parameters['search']   = { in: 'query', type: 'string', description: 'Search stall name (max 100 chars)', required: false }
  // #swagger.parameters['category'] = { in: 'query', type: 'string', description: 'Filter by category (max 50 chars)', required: false }
  // #swagger.parameters['page']     = { in: 'query', type: 'integer', description: 'Page number (default: 1, min: 1)', required: false }
  // #swagger.parameters['limit']    = { in: 'query', type: 'integer', description: 'Items per page (default: 10, min: 1, max: 100)', required: false }
  // #swagger.responses[200] = { description: 'List of stalls' }
  return stallController.getStalls(req, res);
});

stallRouter.post('/', (req, res) => {
  // #swagger.parameters['body'] = { 
  //   in: 'body', 
  //   required: true, 
  //   schema: { 
  //     $ref: '#/definitions/StallInput',
  //     properties: {
  //       ownerId: { type: 'integer', description: 'Owner ID (required)' },
  //       name: { type: 'string', description: 'Stall name (required, 3-100 chars, trimmed)' },
  //       category: { type: 'string', description: 'Category (optional, max 50 chars, trimmed)' },
  //       location: { type: 'string', description: 'Location (optional, max 100 chars, trimmed)' },
  //       description: { type: 'string', description: 'Description (optional, max 1000 chars, trimmed)' }
  //     }
  //   } 
  // }
  // #swagger.responses[201] = { description: 'Stall created successfully' }
  // #swagger.responses[400] = { description: 'Invalid input (name must be 3-100 chars, category max 50, location max 100, description max 1000)' }
  // #swagger.responses[404] = { description: 'Owner not found' }
  return stallController.createStall(req, res);
});

stallRouter.get('/:id', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Stall ID (must be > 0)' }
  // #swagger.responses[200] = { description: 'Stall details' }
  // #swagger.responses[400] = { description: 'Invalid ID (must be a positive integer)' }
  // #swagger.responses[404] = { description: 'Stall not found' }
  return stallController.getStallById(req, res);
});

stallRouter.put('/:id', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Stall ID (must be > 0)' }
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/StallInput' } }
  // #swagger.responses[200] = { description: 'Stall updated' }
  // #swagger.responses[400] = { description: 'Invalid ID or invalid input' }
  // #swagger.responses[404] = { description: 'Stall not found' }
  return stallController.updateStall(req, res);
});

stallRouter.delete('/:id', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Stall ID (must be > 0)' }
  // #swagger.responses[200] = { description: 'Stall deleted' }
  // #swagger.responses[400] = { description: 'Invalid ID (must be a positive integer)' }
  // #swagger.responses[404] = { description: 'Stall not found' }
  return stallController.deleteStall(req, res);
});

stallRouter.get('/:id/menus', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Stall ID (must be > 0)' }
  // #swagger.responses[200] = { description: 'Menu items for stall' }
  // #swagger.responses[400] = { description: 'Invalid ID (must be a positive integer)' }
  // #swagger.responses[404] = { description: 'Stall not found' }
  return stallController.getStallMenus(req, res);
});

stallRouter.get('/:id/reviews', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Stall ID (must be > 0)' }
  // #swagger.parameters['page'] = { in: 'query', type: 'integer', description: 'Page number (default: 1, min: 1)', required: false }
  // #swagger.parameters['limit'] = { in: 'query', type: 'integer', description: 'Items per page (default: 10, min: 1, max: 100)', required: false }
  // #swagger.responses[200] = { description: 'List of reviews for stall' }
  // #swagger.responses[400] = { description: 'Invalid ID (must be a positive integer)' }
  // #swagger.responses[404] = { description: 'Stall not found' }
  return stallController.getStallReviews(req, res);
});

export { stallRouter };
