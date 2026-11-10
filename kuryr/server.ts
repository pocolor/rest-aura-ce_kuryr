import express from 'express';
import type { Request, Response } from "express";
import * as crypto from "crypto";

const SHARED_SECRET = "noot noot";
let event_counter = 1

const app = express();
app.use(express.json());

const orders: Record<string, string> = {};

// Endpoint pro přijetí nové objednávky
app.post('/order', (req: Request, res: Response) => {

    const order = req.body;
    const signature = crypto.createHmac('sha256', SHARED_SECRET)
                            .update(order, "utf8")
                            .digest("hex");

    console.log('Přijata objednávka:', order);
    orders[order.id] = "Prijato";

    res.status(202).json({
        id: order.id,
        status: "Objednavka prijata",
        event_id: event_counter
    });
    event_counter++;

    setTimeout(() => {
        console.log(`${order.id}: Restaurace připravuje`);
        orders[order.id] = "Pripravujeme";

        for (let i = 0; i < 2; i++)
        {
            fetch(req.body.callbackUrl, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', "X-Signature": signature},
                body: JSON.stringify({
                    id: order.id,
                    status: "Pripravujeme",
                    event_id: event_counter
                })
            });
        }
        event_counter++;
        setTimeout(() => {
            console.log(`${order.id}: Prepravujeme`);
            orders[order.id] = "Prepravujeme";
            fetch(req.body.callbackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', "X-Signature": signature },
                body: JSON.stringify({
                    id: order.id,
                    status: "Prepravujeme",
                    event_id: event_counter
                })
            });
            event_counter++;
            setTimeout(() => {
                console.log(`${order.id}: Doruceno`);
                orders[order.id] = "Doruceno";
                for (let i = 0; i < 2; i++) {
                    fetch(req.body.callbackUrl, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json', "X-Signature": signature},
                        body: JSON.stringify({
                            id: order.id,
                            status: "Doruceno",
                            event_id: event_counter
                        })
                    });
                }
                event_counter++;
            }, 5000)
        }, 5000)
    }, 5000);
});

app.listen(3000, () => {
    console.log('Courier runs on http://localhost:3000');
});
