import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import gameRouter from './blackjack.router.js';

const app: Application = express();
const PORT: number = 42069;

app.use(express.json());
app.use(cors());

const spec = parse(readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

app.get('/status', (req: Request, res: Response) => {
    res.status(200).json({ isRunning: true });
});

app.use(gameRouter);

app.listen(PORT, () => {
    console.log("[SERVER] Lets go my G");
});