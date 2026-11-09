import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// Endpoint pro přijetí nové objednávky
app.post('/order', (req: Request, res: Response) => {
    const order = req.body;
    console.log('Přijata objednávka:', order);
    setTimeout(() => {
        console.log(`${order.id}: Restaurace připravuje`);
        setTimeout(() => {
            console.log(`${order.id}: Prepravujeme`);
            setTimeout(() => {
                console.log(`${order.id}: Doruceno`);
                res.status(202).json({
                    id: order.id,
                    message: "Doruceno"
                });
            }, 1000)
        }, 1000)
    }, 1000);
});

app.listen(3000, () => {
    console.log('Courier runs on http://localhost:3000');
});