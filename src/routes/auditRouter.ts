import { Router } from 'express';
import { AuditController } from '../controllers/auditController.ts';

const auditRouter = Router();
const auditController = new AuditController();

auditRouter.post('/', (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/AuditInput' } }
  // #swagger.responses[201] = { description: 'Audit log dibuat' }
  // #swagger.responses[400] = { description: 'Action tidak valid' }
  return auditController.createAuditLog(req, res);
});

auditRouter.get('/:id', (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Detail audit log' }
  // #swagger.responses[404] = { description: 'Audit log tidak ditemukan' }
  return auditController.getAuditLogById(req, res);
});

export { auditRouter };
