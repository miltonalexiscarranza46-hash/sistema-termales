const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

// Sin sesión, vuelve al login
if (!token || !usuario) {
  window.location.href = '../index.html';
}

// Módulos, qué roles los ven y la descripción de su tarjeta de inicio
const modulos = [
  { nombre: 'Accesos a piscinas', roles: ['recepcionista'], cargar: cargarAccesos,
    descripcion: 'Registra la entrada de los visitantes según el tipo de boleto.' },
  { nombre: 'Reservas de cabañas', roles: ['recepcionista'], cargar: cargarReservas,
    descripcion: 'Crea reservas, revisa la disponibilidad y cancela cuando haga falta.' },
  { nombre: 'Masajes', roles: ['masajista'], cargar: cargarMasajes,
    descripcion: 'Agenda las citas con su hora, cóbralas o cancélalas.' },
  { nombre: 'Restaurante y bar', roles: ['mesero'],
    descripcion: 'Toma los pedidos y cobra las cuentas del restaurante y el bar.' },
  { nombre: 'Inventario', roles: ['bodega', 'mesero'],
    descripcion: 'Consulta las existencias y registra entradas y salidas de productos.' },
  { nombre: 'Caja', roles: ['cajero'], cargar: cargarCaja,
    descripcion: 'Recibe el efectivo de cada empleado y cierra la caja del día.' },
  { nombre: 'Enviar reporte', roles: ['recepcionista', 'masajista', 'mesero', 'bodega', 'cajero'],
    descripcion: 'Envía al administrador el reporte de tu turno.' },
  { nombre: 'Resumen del día', roles: ['administrador'], cargar: cargarResumen,
    descripcion: 'Mira los ingresos, los gastos, el balance y el estado de la caja.' },
  { nombre: 'Gastos', roles: ['administrador'], cargar: cargarGastos,
    descripcion: 'Registra y consulta lo que se ha gastado cada día.' },
  { nombre: 'Reportes recibidos', roles: ['administrador'],
    descripcion: 'Lee los reportes que envía cada empleado.' },
  { nombre: 'Usuarios', roles: ['administrador'],
    descripcion: 'Crea y administra las cuentas del sistema.' },
];

document.getElementById('datosUsuario').textContent =
  usuario.nombre + ' · ' + usuario.rol;

const nav = document.getElementById('navegacion');
const area = document.getElementById('area');
const titulo = document.getElementById('titulo');
const visibles = modulos.filter((m) => m.roles.includes(usuario.rol));

function marcarActivo(boton) {
  nav.querySelectorAll('button').forEach((b) => b.classList.remove('activo'));
  if (boton) boton.classList.add('activo');
}

function abrirModulo(m) {
  marcarActivo(m.boton);
  titulo.textContent = m.nombre;
  area.innerHTML = '';
  if (m.cargar) {
    m.cargar(area);
  } else {
    area.innerHTML = '<p>Módulo en construcción.</p>';
  }
}

function mostrarInicio() {
  marcarActivo(botonInicio);
  titulo.textContent = 'Bienvenido';
  area.innerHTML = '';
  cargarInicio(area, usuario, visibles, abrirModulo);
}

// Botón Inicio (primero del menú)
const botonInicio = document.createElement('button');
botonInicio.textContent = 'Inicio';
botonInicio.addEventListener('click', mostrarInicio);
nav.appendChild(botonInicio);

// Botones de los módulos del rol
visibles.forEach((m) => {
  const boton = document.createElement('button');
  boton.textContent = m.nombre;
  boton.addEventListener('click', () => abrirModulo(m));
  m.boton = boton;
  nav.appendChild(boton);
});

document.getElementById('btnSalir').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '../index.html';
});

// Pantalla inicial
mostrarInicio();