import { Router } from 'express';
import { UserController } from '../controllers/userController.ts';

const authRouter = Router();
const userController = new UserController();

authRouter.post('/register', (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/UserInput' } }
  // #swagger.responses[201] = { description: 'Pengguna dibuat' }
  // #swagger.responses[409] = { description: 'Email sudah terdaftar' }
  return userController.createUser(req, res);
});

authRouter.post('/login', (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/LoginInput' } }
  // #swagger.responses[201] = { description: 'Login berhasil dan JWT token dibuat' }
  // #swagger.responses[401] = { description: 'Email atau password salah' }
  return userController.login(req, res);
});

authRouter.get('/me', (req, res) => {
  // #swagger.parameters['auth_token'] = { in: 'header', required: true, type: 'string' }
  // #swagger.responses[201] = { description: 'Token valid' }
  // #swagger.responses[401] = { description: 'Token tidak valid' }
  return userController.me(req, res);
});

export { authRouter };
