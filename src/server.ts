import express, {type Application, type Request, type Response } from 'express';
import cors from 'cors';

const app: Application = express();
const PORT: number = 42069;

app.use(express.json());
app.use(cors());

app.get('/status', (req: Request, res: Response) => {
    res.status(200).json({isRunning: true});
});

app.listen(PORT, () => {
    console.log("[SERVER] Lets go my G");
})