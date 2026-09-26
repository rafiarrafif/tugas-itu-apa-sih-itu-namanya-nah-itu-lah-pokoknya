import type { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService.ts';

// Extend Express Request to store userId from auth (or header)
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Capture response original method
  const originalJson = res.json;

  res.json = function (body: any) {
    // Auto-log POST, PUT, DELETE actions
    const method = req.method;
    const userId = req.userId || req.headers['x-user-id'];

    // Determine action based on HTTP method
    let action: 'CREATE' | 'UPDATE' | 'DELETE' | undefined;
    if (method === 'POST') action = 'CREATE';
    if (method === 'PUT') action = 'UPDATE';
    if (method === 'DELETE') action = 'DELETE';

    // Only log if action is one of POST/PUT/DELETE and response is successful (2xx)
    if (action && this.statusCode >= 200 && this.statusCode < 300) {
      // Extract target table from route path
      // Example: /api/v1/users -> USERS, /api/v1/menu-items -> MENU_ITEMS, /api/v1/stalls -> STALLS
      const pathSegments = req.path.split('/').filter(Boolean);
      let targetTable = '';
      let targetId = 0;

      if (pathSegments.length >= 3) {
        const resource = pathSegments[2]; // e.g., 'users', 'stalls', 'menu-items'
        // Convert kebab-case to UPPER_CASE
        targetTable = resource
          .split('-')
          .map((part) => part.toUpperCase())
          .join('_');

        // Try to extract ID from body or params
        if (body.data?.id) {
          targetId = body.data.id;
        } else if (req.params.id) {
          targetId = Number(req.params.id);
        }
      }

      // Create audit log asynchronously (don't block response)
      if (targetTable && userId) {
        const auditService = new AuditService();
        const metadata = {
          path: req.path,
          method: req.method,
          statusCode: this.statusCode,
        };

        auditService
          .createAuditLog({
            userId: Number(userId),
            action,
            targetTable,
            targetId,
            metadata: JSON.stringify(metadata),
          })
          .catch((err) => {
            console.error('Audit log creation failed:', err);
          });
      }
    }

    // Call original json method
    return originalJson.call(this, body);
  };

  next();
};
