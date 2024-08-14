const express = require('express');
const route = express.Router();
const { getInventario, saveInventario } = require('../controllers/Inventario.Controlador');

route.get("/inventario", getInventario);
route.post("/inventario", saveInventario);

module.exports = route;
