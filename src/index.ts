import express, { type Request, type Response, type Application } from 'express';
import { sql } from 'drizzle-orm';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger-output.json' with { type: 'json' };
import { getDb } from './db/index.ts';
import { stallRouter } from './routes/stallRouter.ts';
import { userRouter } from './routes/userRouter.ts';
import { menuItemRouter } from './routes/menuItemRouter.ts';
import { reviewRouter } from './routes/reviewRouter.ts';
import { likeRouter } from './routes/likeRouter.ts';
import { flagRouter } from './routes/flagRouter.ts';
import { auditRouter } from './routes/auditRouter.ts';
import { auditMiddleware } from './middleware/auditMiddleware.ts';

const app: Application = express();
const PORT: number = 3000;

app.use(express.json());

// Audit middleware untuk auto-logging POST, PUT, DELETE actions
app.use(auditMiddleware);

// Dokumentasi API (Swagger UI) dari spec hasil generate swagger-autogen.
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1 AS ok`);
    res.status(200).json({ status: 'success', message: 'Server dan database terhubung' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal terhubung ke database',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.use('/api/v1/stalls', stallRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/menu-items', menuItemRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/likes', likeRouter);
app.use('/api/v1/flags', flagRouter);
app.use('/api/v1/audit', auditRouter);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
