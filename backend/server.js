require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/salud', async (req, res) => {
  try {
    const r = await pool.query('SELECT COUNT(*) FROM roles');
    res.json({ ok: true, roles: r.rows[0].count });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/accesos', require('./routes/accesos'));
app.use('/api/reservas', require('./routes/reservas'));
app.use('/api/masajes', require('./routes/masajes'));
app.use('/api/resumen', require('./routes/resumen'));
app.use('/api/gastos', require('./routes/gastos'));
app.use('/api/caja', require('./routes/caja'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/bar', require('./routes/bar'));
app.use('/api/reportes', require('./routes/reportes'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));