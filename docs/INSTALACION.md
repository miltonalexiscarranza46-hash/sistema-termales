# Instalación del proyecto: Sistema Termales Santa Teresa

Cada persona del equipo tiene su propia base de datos local. Lo que se comparte
es el código (GitHub). Los datos no se comparten.

## 1. Programas necesarios
- Git
- Node.js (versión LTS)
- PostgreSQL 18 (incluye pgAdmin). Anota la contraseña que le pongas al usuario `postgres`.
- Visual Studio Code

## 2. Acceso al repositorio
El repositorio es privado. Pide a Milton que te invite como colaborador y acepta
la invitación que llega a tu correo de GitHub.

## 3. Clonar el proyecto
En PowerShell, dentro de la carpeta donde quieres guardarlo:

```powershell
git clone https://github.com/miltonalexiscarranza46-hash/sistema-termales.git Termales
cd Termales
git config --global user.name "Tu nombre"
git config --global user.email "tu-correo@ejemplo.com"
```

## 4. Instalar dependencias
```powershell
cd backend
npm install
```
Si PowerShell bloquea npm:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## 5. Crear y restaurar la base de datos
1. En pgAdmin: clic derecho en **Databases**, **Create**, **Database**.
   Nombre exacto: `BD-Termales`.
2. Desde la carpeta raíz del proyecto (`Termales`), restaura el respaldo:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d BD-Termales -f docs\bd-termales.sql
```
Te pide la contraseña de `postgres`. Al terminar no deben aparecer errores en rojo.
Si instalaste otra versión de PostgreSQL, cambia el `18` de la ruta.

## 6. Archivo .env
```powershell
cd backend
copy .env.example .env
```
Abre `backend/.env` en VS Code y cambia:
- `DB_PASSWORD`: la contraseña de tu usuario `postgres`.
- `JWT_SECRET`: cualquier texto largo y difícil de adivinar.

El archivo `.env` nunca se sube a GitHub ni se comparte por chat.

## 7. Arrancar el sistema
Dentro de `backend`:
```powershell
npm run dev
```
Abre http://localhost:3000. Debe aparecer `Servidor en http://localhost:3000` en la terminal.

| Usuario | Contraseña | Rol |
|---|---|---|
| admin | admin123 | administrador |
| recepcion | 1234 | recepcionista |
| masajista | 1234 | masajista |
| bodega | 1234 | bodega |
| mesero | 1234 | mesero |
| cajero | 1234 | cajero |

Son usuarios de prueba. Se cambian antes de presentar.

## 8. Qué ve cada rol
| Rol | Módulos |
|---|---|
| Administrador | Resumen del día, Gastos, Reportes recibidos, Usuarios |
| Recepcionista | Accesos a piscinas, Reservas de cabañas, Enviar reporte |
| Masajista | Masajes, Enviar reporte |
| Mesero | Restaurante y bar, Inventario (solo consulta), Enviar reporte |
| Bodega | Inventario, Enviar reporte |
| Cajero | Caja, Enviar reporte |

## 9. Cómo trabajamos (flujo del equipo)
1. Cada quien trabaja en su propia rama, nunca directo en `main`:
```powershell
git checkout main
git pull
git checkout -b nombre-de-tu-rama
```
2. Cada módulo se construye con el mismo patrón:
   - `backend/controllers/x Controller.js` (la lógica)
   - `backend/routes/x.js` (usa `verificarToken` y `permitirRoles`)
   - una línea en `backend/server.js`
   - `frontend/js/modulos/x.js` y `frontend/css/modulos/x.css`
   - un `<link>` y un `<script>` en `frontend/pages/dashboard.html`
     (el script del módulo va antes de `dashboard.js`)
   - `cargar: cargarX` en la lista `modulos` de `frontend/js/dashboard.js`
3. Se prueba primero el backend en PowerShell y después la pantalla.
4. Para guardar:
```powershell
git add .
git status --short
git commit -m "Descripcion corta"
git push -u origin nombre-de-tu-rama
```
   Revisa que en `git status --short` no aparezca `backend/.env`.
5. En GitHub se crea el pull request y se hace **Merge primero**. Solo después
   se hace `git checkout main` y `git pull`.

## 10. Cambios en la base de datos
Si cambias la estructura (tablas o columnas), guarda el cambio en un archivo
numerado dentro de `docs/migraciones/` (`002-...sql`, `003-...sql`) y avisa al
equipo para que lo ejecute en su base de datos. No edites la base de datos a mano
sin dejar el archivo.

## 11. Conflictos en server.js y dashboard.js
Es normal que ambos agreguen líneas en los mismos archivos. Si git marca un
conflicto (`<<<<<<<`, `=======`, `>>>>>>>`), conserva las líneas de los dos lados
y borra solo las marcas.

## 12. Errores frecuentes
- "No es posible conectar con el servidor": el servidor está apagado. Enciéndelo con `npm run dev`.
- `npm` y `node` se ejecutan dentro de `backend`; `git`, desde la raíz `Termales`.
- Recargar el navegador: `Ctrl + Shift + R`. Consola: `Ctrl + Shift + I`.