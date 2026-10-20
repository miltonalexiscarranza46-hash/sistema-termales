function cargarInicio(area, usuario, modulos, abrir) {
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  const textoRol = {
    administrador:
      'Tu panel es de consulta: revisa el resumen del día, registra los gastos y lee los reportes del personal.',
    recepcionista:
      'Registra las entradas a las piscinas y administra las reservas de las cabañas.',
    masajista:
      'Agenda las citas de masajes, cóbralas y consulta tu horario.',
    mesero:
      'Toma los pedidos del restaurante y bar, y consulta las existencias del inventario.',
    bodega:
      'Controla las entradas y salidas de los productos del inventario.',
    cajero:
      'Recibe el efectivo que entrega cada empleado y cierra la caja del día.',
  };

  area.innerHTML = `
    <div class="inicio">
      <div class="inicio-cabecera">
        <h2 id="inicioSaludo"></h2>
        <p id="inicioRol"></p>
        <p id="inicioFecha" class="inicio-fecha"></p>
      </div>

      <h3 class="inicio-subtitulo">Tus módulos</h3>
      <div class="inicio-tarjetas" id="inicioTarjetas"></div>
    </div>
  `;

  area.querySelector('#inicioSaludo').textContent = saludo + ', ' + usuario.nombre;
  area.querySelector('#inicioRol').textContent = textoRol[usuario.rol] || '';
  area.querySelector('#inicioFecha').textContent = new Date().toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const contenedor = area.querySelector('#inicioTarjetas');
  modulos.forEach((m) => {
    const tarjeta = document.createElement('button');
    tarjeta.type = 'button';
    tarjeta.className = 'inicio-tarjeta';

    const titulo = document.createElement('strong');
    titulo.textContent = m.nombre;

    const detalle = document.createElement('span');
    detalle.textContent = m.descripcion || '';

    tarjeta.appendChild(titulo);
    tarjeta.appendChild(detalle);
    tarjeta.addEventListener('click', () => abrir(m));
    contenedor.appendChild(tarjeta);
  });
}