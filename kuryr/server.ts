import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

const orders: Record<string, string> = {};

// Endpoint pro přijetí nové objednávky
app.post('/order', (req: Request, res: Response) => {
    const order = req.body;
    console.log('Přijata objednávka:', order);
    orders[order.id] = "Prijato";

    res.status(202).json({
        id: order.id,
        status: "Objednavka prijata"
    });

    setTimeout(() => {
        console.log(`${order.id}: Restaurace připravuje`);
        orders[order.id] = "Pripravujeme";
        fetch(req.body.callbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: order.id,
                status: "Pripravujeme"
            })
        });
        setTimeout(() => {
            console.log(`${order.id}: Prepravujeme`);
            orders[order.id] = "Prepravujeme";
            fetch(req.body.callbackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: order.id,
                    status: "Prepravujeme"
                })
            });
            setTimeout(() => {
                console.log(`${order.id}: Doruceno`);
                orders[order.id] = "Doruceno";
                fetch(req.body.callbackUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: order.id,
                        status: "Doruceno"
                    })
                });
            }, 5000)
        }, 5000)
    }, 5000);
});

app.listen(3000, () => {
    console.log('Courier runs on http://localhost:3000');
});