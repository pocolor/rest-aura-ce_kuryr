const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const orders = {};

app.post('/update', (req, res) => {
  const { id, status } = req.body;
  orders[id] = status;
  console.log(`${id}: ${status}`);
  res.sendStatus(200);
});

app.get('/orders', (req, res) => {
  res.json(orders);
});

app.listen(3001, () => {
  console.log('Restaurant runs on http://localhost:3001');
});
