const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = 3001;
const COURIER_URL = 'http://localhost:3000';
const SHARED_SECRET = process.env.SHARED_SECRET || 'moje-tajne-heslo';

// Jednoduché úložiště v paměti serveru.
const orders = {};
const processedEvents = new Set();

// Webhook nejprve načteme jako surová data, abychom ověřili přesně podepsaný obsah.
app.post('/update', express.raw({ type: 'application/json' }), (req, res) => {
  const rawBody = req.body;
  const signature = (req.get('X-Signature') || '').trim();

  if (!Buffer.isBuffer(rawBody) || !signature) {
    return res.sendStatus(401);
  }

  const expected = crypto
    .createHmac('sha256', SHARED_SECRET)
    .update(rawBody)
    .digest('hex');

  // Timing-safe porovnání podpisů.
  const receivedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    console.log('Odmítnut webhook: neplatný podpis.');
    return res.sendStatus(401);
  }

  let data;
  try {
    data = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.sendStatus(400);
  }

  const { id, status, event_id } = data;
  if (!id || !status || !event_id) {
    return res.status(400).json({ error: 'Chybí id, status nebo event_id' });
  }

  if (processedEvents.has(event_id)) {
    console.log(`Duplicitní událost ${event_id} ignorována.`);
    return res.sendStatus(200);
  }

  processedEvents.add(event_id);
  orders[id] = status;
  console.log(`Aktualizace objednávky ${id}: ${status}`);
  res.sendStatus(200);
});

// JSON parser pro běžné požadavky (mimo webhook endpoint).
app.use(express.json());
app.use(express.static('public'));

// Restaurace vytvoří objednávku a pošle ji kurýrovi.
app.post('/create-order', async (req, res) => {
  const id = req.body.id || `obj-${Date.now()}`;
  const callbackUrl = 'http://localhost:3001/update';

  // Objednávku zobrazíme hned, než dorazí první webhook.
  orders[id] = 'Žádost o objednávku';

  try {
    const response = await fetch(`${COURIER_URL}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, callbackUrl })
    });

    if (!response.ok && response.status !== 202) {
      delete orders[id];
      return res.status(502).json({ error: 'Kurýr objednávku nepřijal' });
    }

    res.status(202).json({ id, status: 'Žádost o objednávku' });
  } catch (error) {
    delete orders[id];
    res.status(502).json({ error: 'Kurýrní server není dostupný' });
  }
});

// Seznam objednávek pro webovou stránku.
app.get('/orders', (req, res) => {
  res.json(orders);
});

app.listen(PORT, () => {
  console.log(`Restaurant runs on http://localhost:${PORT}`);
});
