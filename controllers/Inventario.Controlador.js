const mysql = require('mysql2');

const Pool = mysql.createPool({
    host: '191.101.13.154',
    user: 'u531493727_adela',
    password: 'Rugis-hde3',
    database: 'u531493727_bd_preciounico',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const getInventario = (req, res) => {
    Pool.query('SELECT * FROM tblinventarios', (error, results) => {
        if (error) {
            console.log(error)
            throw error;
        }
        res.json(results);
    });
};

const saveInventario = (req, res) => {
    const inventario = req.body;
    const query = `
        INSERT INTO tblinventarios (id_productos, fecha_de_realizacion, id_usuario, cantidad_fisica, cantidad_en_sistema, cantidad_en_bodega, diferencia)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        inventario.id_productos,
        inventario.fecha_de_realizacion,
        inventario.id_usuario,
        inventario.cantidadFisica,
        inventario.cantidadSistema,
        inventario.cantidadBodega,
        inventario.diferencia,
    ];

    Pool.query(query, params, (error, results) => {
        if (error) {
            console.log("Error al guardar inventario:", error);
            res.status(500).json({ error: 'Error al guardar inventario' });
            return;
        }
        res.status(200).json({ message: 'Inventario guardado correctamente' });
    });
};

module.exports = {
    getInventario,
    saveInventario
};
