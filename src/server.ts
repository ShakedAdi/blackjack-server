import express, {type Application, type Request, type Response } from 'express';

const app: Application = express();
const PORT: number = 42069;

app.use(express.json());

app.get('/status', (req: Request, res: Response) => {
    res.status(200).json({isRunning: true});
});

app.listen(PORT, () => {
    console.log("[SERVER] Lets go my G");
})