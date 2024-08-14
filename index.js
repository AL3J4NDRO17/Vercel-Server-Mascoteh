const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const port = 4000;
const RouterCatgeorias = require("./routers/Categoria.routes")
const RouterProductos = require("./routers/Productos.routes");
const RouterInventario = require("./routers/Inventario.routers");

app.use(cors());

app.use(bodyParser.json());
  
// const Pool = mysql.createPool({
//   host: 'srv900.hstgr.io', // O usa '191.101.13.154'
//   user: 'u531493727_adela',
//   password: 'Rugis-hde3',
//   database: 'u531493727_bd_preciounico',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

const Pool = mysql.createPool({
   host: '192.168.1.69', // O usa '191.101.13.154'
   user: 'root',
   password: '',
   database: 'clima',
   waitForConnections: true,
   connectionLimit: 10,
   queueLimit: 0,
   connectTimeout: 30000  
});   
console.log("object");   
Pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.code);
    if (err.code === 'TIMEOUT') {
      console.error('Connection timeout. Please check network connectivity and MySQL server status.');
    } else {
      console.error('Other error:', err);
    }
    return;
  }
  console.log('Connected to MySQL as id', connection.threadId);
  connection.release(); 
});

app.use('/api', RouterCatgeorias);
app.use('/api', RouterProductos);
app.use('/api', RouterInventario);

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(password)
  Pool.query('SELECT * FROM tblusuarios WHERE correo = ?', [username], (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error: 'Database query error' });
      return;
    }

    if (results.length === 0) {
      res.status(401).json({ error: 'El usuario no existe' });
      return;
    }

    const user = results[0];

    if (user.Contrasena === password) {
      res.json({ message: 'Login successful', user });
    } else {
      res.status(401).json({ error: 'Contraseña incorrecta' });
    }
  });
});


app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});

module.exports = Pool.promise();
