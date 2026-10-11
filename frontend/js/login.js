const form = document.getElementById('formLogin');
const mensaje = document.getElementById('mensaje');

// Si ya hay sesión, entra directo
if (localStorage.getItem('token')) {
  window.location.href = 'pages/dashboard.html';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensaje.textContent = '';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: document.getElementById('usuario').value,
        contrasena: document.getElementById('contrasena').value,
      }),
    });
    const datos = await res.json();

    if (!datos.ok) {
      mensaje.textContent = datos.mensaje;
      return;
    }

    localStorage.setItem('token', datos.token);
    localStorage.setItem('usuario', JSON.stringify(datos.usuario));
    window.location.href = 'pages/dashboard.html';
  } catch {
    mensaje.textContent = 'No se pudo conectar con el servidor';
  }
});