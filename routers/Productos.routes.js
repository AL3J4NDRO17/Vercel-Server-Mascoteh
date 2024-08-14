const express = require('express');
const route = express.Router();
const { getProductos } = require('../controllers/Productos');


route.get("/productos",getProductos);

module.exports = route;
