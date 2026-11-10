const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = 3000;
const SHARED_SECRET = process.env.SHARED_SECRET || 'moje-tajne-heslo';
const STATES = ['Restaurace připravuje', 'Rozváží se', 'Doručeno'];

function sendWebhook(callbackUrl, payload) {
  // Podepisujeme přesně ten JSON řetězec, který následně odešleme.
  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', SHARED_SECRET)
    .update(body, 'utf8')
    .digest('hex');

  return fetch(callbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature
    },
    body
  });
}

app.post('/order', (req, res) => {
  const { id, callbackUrl } = req.body;

  if (!id || !callbackUrl) {
    return res.status(400).json({ error: 'Chybí id nebo callbackUrl' });
  }

  try {
    const url = new URL(callbackUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return res.status(400).json({ error: 'Neplatné callbackUrl' });
    }
  } catch {
    return res.status(400).json({ error: 'Neplatné callbackUrl' });
  }

  console.log(`Přijata objednávka ${id}`);
  res.sendStatus(202); // Objednávku jsme přijali, další práce probíhá na pozadí.

  STATES.forEach((status, index) => {
    setTimeout(async () => {
      const payload = {
        id,
        status,
        event_id: crypto.randomUUID()
      };

      try {
        const response = await sendWebhook(callbackUrl, payload);
        console.log(`${id}: ${status} (HTTP ${response.status})`);

        // Ukázka duplicitní notifikace: stejná událost se stejným event_id.
        if (index === 0) {
          setTimeout(async () => {
            try {
              const retryResponse = await sendWebhook(callbackUrl, payload);
              console.log(`${id}: opakované odeslání stejné události (HTTP ${retryResponse.status})`);
            } catch (error) {
              console.error('Chyba při opakovaném webhooku:', error.message);
            }
          }, 500);
        }
      } catch (error) {
        console.error(`Webhook pro ${id} se nepodařilo odeslat:`, error.message);
      }
    }, (index + 1) * 3000);
  });
});

app.listen(PORT, () => {
  console.log(`Courier runs on http://localhost:${PORT}`);
});
