const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

// Sin sesión, vuelve al login
if (!token || !usuario) {
  window.location.href = '../index.html';
}

// Módulos y qué roles los ven
const modulos = [
  { nombre: 'Accesos a piscinas', roles: ['recepcionista'], cargar: cargarAccesos },
  { nombre: 'Reservas de cabañas', roles: ['recepcionista'], cargar: cargarReservas },
  { nombre: 'Masajes', roles: ['masajista'], cargar: cargarMasajes },
  { nombre: 'Restaurante y bar', roles: ['mesero'] },
  { nombre: 'Inventario', roles: ['bodega', 'mesero'] },
  { nombre: 'Caja', roles: ['cajero'] },
  { nombre: 'Enviar reporte', roles: ['recepcionista', 'masajista', 'mesero', 'bodega', 'cajero'] },
  { nombre: 'Resumen del día', roles: ['administrador'], cargar: cargarResumen },
  { nombre: 'Gastos', roles: ['administrador'] },
  { nombre: 'Reportes recibidos', roles: ['administrador'] },
  { nombre: 'Usuarios', roles: ['administrador'] },
];

document.getElementById('datosUsuario').textContent =
  usuario.nombre + ' · ' + usuario.rol;

const nav = document.getElementById('navegacion');
modulos
  .filter((m) => m.roles.includes(usuario.rol))
  .forEach((m) => {
    const boton = document.createElement('button');
    boton.textContent = m.nombre;
    boton.addEventListener('click', () => {
        nav.querySelectorAll('button').forEach((b) => b.classList.remove('activo'));
boton.classList.add('activo');
      document.getElementById('titulo').textContent = m.nombre;
const area = document.getElementById('area');
if (m.cargar) {
  m.cargar(area);
} else {
  area.innerHTML = '<p>Módulo en construcción.</p>';
}
      
    });
    nav.appendChild(boton);
  });

document.getElementById('btnSalir').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '../index.html';
});
