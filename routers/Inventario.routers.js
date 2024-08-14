const express = require('express');
const route = express.Router();
const { getInventario } = require('../controllers/Inventario.Controlador');


route.get("/inventario",getInventario);

module.exports = route;
