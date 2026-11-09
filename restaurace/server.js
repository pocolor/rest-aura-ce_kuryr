fetch('http://localhost:3000/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'objednavka1',
    callbackUrl: 'http://localhost:3001/update'
  })
})
    .then(res => {
      console.log(res.status);
      return res.json();
    })
   .then(status => console.log('Courier response:', status))
   