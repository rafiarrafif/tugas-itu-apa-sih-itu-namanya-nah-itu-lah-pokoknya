import { Router } from 'express';
import { FlagController } from '../controllers/flagController.ts';

const flagRouter = Router();
const flagController = new FlagController();

flagRouter.get('/:id', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Detail bendera laporan' }
  // #swagger.responses[404] = { description: 'Tidak ditemukan' }
  return flagController.getFlagById(req, res);
});

flagRouter.put('/:id', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/FlagInput' } }
  // #swagger.responses[200] = { description: 'Bendera laporan ter-update' }
  // #swagger.responses[404] = { description: 'Tidak ditemukan' }
  // #swagger.responses[400] = { description: 'Status tidak valid' }
  return flagController.updateFlag(req, res);
});

export { flagRouter };
