fetch('/api/message')
  .then((res) => res.json())
  .then((data) => {
    document.getElementById('message').textContent = data.message;
  })
  .catch((err) => {
    document.getElementById('message').textContent = 'Failed to load message.';
    console.error(err);
  });
