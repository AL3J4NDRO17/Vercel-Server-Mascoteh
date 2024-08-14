const mysql = require('mysql2');

// const Pool = mysql.createPool({
//     host: 'srv900.hstgr.io', 
//     user: 'u531493727_adela',
//     password: 'Rugis-hde3',
//     database: 'u531493727_bd_preciounico',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
//   });
const Pool = mysql.createPool({
host: 'localhost', // O usa '191.101.13.154'
   user: 'root',
   password: '',
   database: 'clima',
   waitForConnections: true,
   connectionLimit: 10,
   queueLimit: 0
  });  
  const getProductos = (req, res) => {
    Pool.query('SELECT * FROM tblproductos', (error, results) => {
        if (error) {
            console.log(error);
            throw error;
        }
        
        // Convertir la imagen a base64 para cada producto
        const productos = results.map(producto => {
            if (producto.Imagen) {
                producto.Imagen = producto.Imagen.toString('base64');
            }
            return producto;
        });
        
        res.json(productos);
    });
};


module.exports = {
    getProductos
}
