async function api(ruta, opciones = {}) {
  const token = localStorage.getItem('token');

  const res = await fetch('/api' + ruta, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
      ...(opciones.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '../index.html';
    throw new Error('Sesión vencida');
  }

  return res.json();
}