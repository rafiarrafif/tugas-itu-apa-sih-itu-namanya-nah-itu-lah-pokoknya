import { Router } from 'express';
import { AuditController } from '../controllers/auditController.ts';

const auditRouter = Router();
const auditController = new AuditController();

auditRouter.get('/', (req, res) => {
  // #swagger.parameters['userId']     = { in: 'query', type: 'integer', description: 'Filter by user ID' }
  // #swagger.parameters['action']     = { in: 'query', type: 'string', description: 'Filter by action: CREATE, UPDATE, DELETE' }
  // #swagger.parameters['targetTable']= { in: 'query', type: 'string', description: 'Filter by target table name' }
  // #swagger.parameters['search']     = { in: 'query', type: 'string', description: 'Search in action' }
  // #swagger.parameters['page']       = { in: 'query', type: 'integer' }
  // #swagger.parameters['limit']      = { in: 'query', type: 'integer' }
  // #swagger.responses[200] = { description: 'Daftar audit logs' }
  return auditController.getAuditLogs(req, res);
});

auditRouter.post('/', (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/AuditInput' } }
  // #swagger.responses[201] = { description: 'Audit log dibuat' }
  // #swagger.responses[400] = { description: 'Action tidak valid' }
  return auditController.createAuditLog(req, res);
});

export { auditRouter };
