async function cargarUsuarios(area) {
  area.innerHTML = `
    <div class="usuarios">
      <form id="formUsuario" class="usuarios-form">
        <div class="campo">
          <label for="uNombre">Nombre completo</label>
          <input type="text" id="uNombre" maxlength="100" required autocomplete="off">
        </div>

        <div class="campo">
          <label for="uUsuario">Usuario</label>
          <input type="text" id="uUsuario" maxlength="50" required autocomplete="off">
          <small class="usuarios-ayuda">Minúsculas, números, punto, guion o guion bajo.</small>
        </div>

        <div class="campo">
          <label for="uContrasena">Contraseña</label>
          <input type="password" id="uContrasena" minlength="6" maxlength="72" required autocomplete="new-password">
          <small class="usuarios-ayuda">Mínimo 6 caracteres.</small>
        </div>

        <div class="campo">
          <label for="uRol">Rol</label>
          <select id="uRol" required></select>
        </div>

        <button type="submit">Crear usuario</button>
      </form>

      <p id="mensajeUsuarios" class="mensaje" role="status"></p>

      <div id="uPanel" class="usuarios-panel" hidden></div>

      <div class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="filasUsuarios"></tbody>
        </table>
      </div>
    </div>
  `;

  const q = (s) => area.querySelector(s);
  const form = q('#formUsuario');
  const selRol = q('#uRol');
  const mensaje = q('#mensajeUsuarios');
  const panel = q('#uPanel');
  const tbody = q('#filasUsuarios');

  let roles = [];

  const etiqueta = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  const el = (tag, clase, texto) => {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  };

  // Campo con etiqueta
  const campo = (texto, control) => {
    const div = el('div', 'campo');
    const label = el('label', '', texto);
    label.htmlFor = control.id;
    div.appendChild(label);
    div.appendChild(control);
    return div;
  };

  const boton = (texto, clase, alHacerClic) => {
    const b = el('button', clase, texto);
    b.type = 'button';
    b.addEventListener('click', alHacerClic);
    return b;
  };

  function llenarRoles(select, seleccionado) {
    select.innerHTML = '';
    roles.forEach((r) => {
      const op = document.createElement('option');
      op.value = r.id;
      op.textContent = etiqueta(r.nombre);
      select.appendChild(op);
    });
    if (seleccionado !== undefined) select.value = seleccionado;
  }

  async function cargarRoles() {
    const d = await api('/usuarios/roles');
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }
    roles = d.roles;
    llenarRoles(selRol);
  }

  async function cargar() {
    const d = await api('/usuarios');
    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    tbody.innerHTML = '';
    d.usuarios.forEach((u) => {
      const tr = document.createElement('tr');
      if (!u.activo) tr.className = 'usuario-inactivo';

      [u.nombre + (u.es_yo ? ' (tú)' : ''), u.usuario, etiqueta(u.rol)].forEach((v) => {
        tr.appendChild(el('td', '', v));
      });

      const tdEstado = document.createElement('td');
      tdEstado.appendChild(
        el('span', 'usuario-badge ' + (u.activo ? 'activo' : 'inactivo'), u.activo ? 'Activo' : 'Desactivado')
      );
      tr.appendChild(tdEstado);

      const tdAcc = el('td', 'usuarios-acciones');
      tdAcc.appendChild(boton('Editar', 'btn-secundario', () => abrirEditar(u)));
      tdAcc.appendChild(boton('Contraseña', 'btn-secundario', () => abrirContrasena(u)));
      if (!u.es_yo) {
        if (u.activo) {
          tdAcc.appendChild(boton('Desactivar', 'btn-peligro', () => cambiarActivo(u, false)));
        } else {
          tdAcc.appendChild(boton('Activar', 'btn-secundario', () => cambiarActivo(u, true)));
        }
      }
      tr.appendChild(tdAcc);

      tbody.appendChild(tr);
    });
  }

  function abrirEditar(u) {
    panel.innerHTML = '';
    panel.appendChild(el('h3', '', 'Editar a ' + u.nombre));

    const inpNombre = el('input');
    inpNombre.type = 'text';
    inpNombre.id = 'eNombre';
    inpNombre.maxLength = 100;
    inpNombre.value = u.nombre;

    const selEditar = el('select');
    selEditar.id = 'eRol';
    llenarRoles(selEditar, u.rol_id);

    const campos = el('div', 'usuarios-panel-campos');
    campos.appendChild(campo('Nombre completo', inpNombre));
    campos.appendChild(campo('Rol', selEditar));
    panel.appendChild(campos);

    if (u.es_yo) {
      selEditar.disabled = true;
      panel.appendChild(el('p', 'usuarios-ayuda', 'No puedes cambiar tu propio rol.'));
    }

    const botones = el('div', 'usuarios-botones');
    botones.appendChild(
      boton('Guardar cambios', '', async () => {
        const d = await api('/usuarios/' + u.id, {
          method: 'PATCH',
          body: JSON.stringify({ nombre: inpNombre.value, rol_id: Number(selEditar.value) }),
        });
        mensaje.textContent = d.mensaje;
        if (d.ok) {
          panel.hidden = true;
          cargar();
        }
      })
    );
    botones.appendChild(boton('Cancelar', 'btn-secundario', () => (panel.hidden = true)));
    panel.appendChild(botones);

    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function abrirContrasena(u) {
    panel.innerHTML = '';
    panel.appendChild(el('h3', '', 'Nueva contraseña para ' + u.nombre));

    const inp = el('input');
    inp.type = 'password';
    inp.id = 'cContrasena';
    inp.minLength = 6;
    inp.maxLength = 72;
    inp.autocomplete = 'new-password';

    const campos = el('div', 'usuarios-panel-campos');
    campos.appendChild(campo('Contraseña nueva (mínimo 6 caracteres)', inp));
    panel.appendChild(campos);

    const botones = el('div', 'usuarios-botones');
    botones.appendChild(
      boton('Restablecer contraseña', '', async () => {
        const d = await api('/usuarios/' + u.id + '/contrasena', {
          method: 'PATCH',
          body: JSON.stringify({ contrasena: inp.value }),
        });
        mensaje.textContent = d.mensaje;
        if (d.ok) panel.hidden = true;
      })
    );
    botones.appendChild(boton('Cancelar', 'btn-secundario', () => (panel.hidden = true)));
    panel.appendChild(botones);

    panel.hidden = false;
    inp.focus();
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function cambiarActivo(u, activo) {
    if (!activo && !confirm('¿Desactivar la cuenta de ' + u.nombre + '? Ya no podrá entrar al sistema.')) {
      return;
    }
    const d = await api('/usuarios/' + u.id + '/activo', {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
    mensaje.textContent = d.mensaje;
    cargar();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const d = await api('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        nombre: q('#uNombre').value,
        usuario: q('#uUsuario').value.trim().toLowerCase(),
        contrasena: q('#uContrasena').value,
        rol_id: Number(selRol.value),
      }),
    });

    if (!d.ok) {
      mensaje.textContent = d.mensaje;
      return;
    }

    mensaje.textContent = 'Usuario creado: ' + d.usuario.usuario;
    form.reset();
    cargar();
  });

  await cargarRoles();
  await cargar();
}