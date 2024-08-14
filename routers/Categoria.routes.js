const express = require('express');
const route = express.Router();
const { getCategorias } = require('../controllers/Categorias.controllers');


route.get("/categorias",getCategorias);

module.exports = route;
