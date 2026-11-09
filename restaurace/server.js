const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const orders = {};
let counter = 0;

app.post('/update', (req, res) => {
  const { id, status } = req.body;
  orders[id] = status;
  console.log(`${id}: ${status}`);
  res.sendStatus(200);
});

app.get('/orders', (req, res) => {
  res.json(orders);
});

app.post('/send-order', async (req, res) => {
  const id = 'objednavka' + (++counter);
  try {
    const response = await fetch('http://localhost:3000/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        callbackUrl: 'http://localhost:3001/update'
      })
    });
    const data = await response.json();
    console.log('Courier response:', response.status, data);

    if (response.status === 202 && data.status === 'Objednavka prijata') {
      orders[data.id] = 'Žádost o objednávku';
    }
    res.sendStatus(response.status);
  } catch (err) {
    console.error('Courier error:', err.message);
    res.sendStatus(502);
  }
});

app.listen(3001, () => {
  console.log('Restaurant runs on http://localhost:3001');
});
  console.log('Courier response:', response.status, await response.text());
  res.sendStatus(response.status);
});

app.listen(3001, () => {
  console.log('Restaurant runs on http://localhost:3001');
});
