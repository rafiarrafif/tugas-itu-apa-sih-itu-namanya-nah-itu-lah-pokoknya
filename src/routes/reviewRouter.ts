import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.ts';

const reviewRouter = Router();
const reviewController = new ReviewController();

reviewRouter.get('/', (req, res) => {
  // #swagger.parameters['search'] = { in: 'query', type: 'string' }
  // #swagger.parameters['stallId'] = { in: 'query', type: 'integer' }
  // #swagger.parameters['userId'] = { in: 'query', type: 'integer' }
  // #swagger.parameters['page'] = { in: 'query', type: 'integer' }
  // #swagger.parameters['limit'] = { in: 'query', type: 'integer' }
  // #swagger.responses[200] = { description: 'Daftar reviews dengan JOIN user & stall' }
  return reviewController.getReviews(req, res);
});

reviewRouter.post('/', (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/ReviewInput' } }
  // #swagger.responses[201] = { description: 'Review dibuat' }
  // #swagger.responses[400] = { description: 'Rating harus antara 1-5' }
  // #swagger.responses[404] = { description: 'Warung atau user tidak ditemukan' }
  return reviewController.createReview(req, res);
});

reviewRouter.delete('/:id', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Review terhapus' }
  // #swagger.responses[404] = { description: 'Review tidak ditemukan' }
  return reviewController.deleteReview(req, res);
});

export { reviewRouter };
