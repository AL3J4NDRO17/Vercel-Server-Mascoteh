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
    host: '172.31.98.25', 
    user: 'chucho',
    password: 'chucho',
    database: 'bd_preciounico',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });  
const getCategorias = (req, res) => {
    Pool.query('SELECT * FROM tblcategorias', (error, results) => {
        if (error) {
            console.log(error)
            throw error;

        }
        res.json(results); 
    }); 
}

module.exports = {
    getCategorias
}