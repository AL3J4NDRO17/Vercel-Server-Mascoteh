const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const nodemailer = require("nodemailer");
const cors = require('cors');
const mqtt = require('mqtt');
const uuid = require('uuid');



const app = express();
const port = 3000;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use(cors());


const mongoUrl = "mongodb+srv://pixon:Filo1234@cluster0.sw8tbcs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const mqttClient = mqtt.connect('mqtt://broker.emqx.io');



/* Cloudinari */
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'ds6sucunj',
  api_key: '772874229173864',
  api_secret: 'TYM3LWIENLvPMOB7AzefRJztr2E'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Mascoteh/Products',
    format: async (req, file) => 'png',
    public_id: (req, file) => {
      const randomName = uuidv4();
      return randomName;
    }
  }
});
const Team = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Mascoteh/Team',
    format: async (req, file) => 'png',
    public_id: (req, file) => {
      const randomName = uuidv4();
      return randomName;
    }
  }
});

const upload = multer({ storage: storage });
const uploadTeam = multer({ storage: Team });

app.post('/upload-image', upload.single('imagen'), (req, res) => {
  console.log("Imagen subida a Cloudinary con éxito");
  // Devuelve la URL de la imagen subida a Cloudinary
  res.json({ mensaje: 'Imagen subida a Cloudinary con éxito', url: req.file.path });
});

/*

  _____ ____  ____    _________     ____ ___  _   _ _______  _____ ___  _   _ 
 | ____/ ___||  _ \  |___ /___ \   / ___/ _ \| \ | | ____\ \/ /_ _/ _ \| \ | |
 |  _| \___ \| |_) |   |_ \ __) | | |  | | | |  \| |  _|  \  / | | | | |  \| |
 | |___ ___) |  __/   ___) / __/  | |__| |_| | |\  | |___ /  \ | | |_| | |\  |
 |_____|____/|_|     |____/_____|  \____\___/|_| \_|_____/_/\_\___\___/|_| \_|
                                                                              



*/
function enviarMensaje(estado) {
  const message = estado === "ON" ? "ON" : estado === "MOVE" ? "MOVE" : "OFF"; // Si estado es "ON" entonces enviar "ON", si es "MOVE" entonces enviar "MOVE", de lo contrario enviar "OFF"
  mqttClient.publish('PIXON', message);
  console.log(`Mensaje MQTT enviado: ${message}`);
}

app.get('/app/data-afnpg/endpoint/EcoNido', (req, res) => {
  const { estado } = req.query; // Use req.query to get parameters from the URL

  if (!estado || (estado !== "ON" && estado !== "OFF" && estado !== "MOVE")) {
    return res.status(400).send('Invalid or missing estado value');
  }

  enviarMensaje(estado);

  res.status(200).send(`Datos ${estado === "ON" ? 'Encendido' : 'Apagado'} recibidos y procesados`);
});
app.get('/getDispositivo', async (req, res) => {
  const dispositivoId = "65eab39b61ff359e597d8a39"; // Obtener el ID del usuario a editar desde los parámetros de la solicitud
  // Obtener los datos del usuario a editar desde el cuerpo de la solicitud
  console.log(dispositivoId);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("DeviceState");

    // Realizar la actualización del usuario en la colección
    const result = await collection.findOne({ _id: new ObjectId(dispositivoId) });
    // Verificar si se actualizó el usuario correctamente
    console.log(result);
    console.log("Producto encontrado correctamente.");
    res.json(result);

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta




  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

app.post('/app/data-afnpg/endpoint/EcoNido', async (req, res) => {
  const { estado } = req.body;

  if (estado !== "ON" && estado !== "OFF" && estado !== "MOVE") {
    return res.status(400).send('Invalid estado value');
  }

  enviarMensaje(estado);

  res.status(200).send(`Datos ${estado === "ON" ? 'Encendido' : 'Apagado'} recibidos y procesados`);

});


app.post('/app/application-0-laqjr/endpoint/SensorData', async (req, res) => {
  const data = req.body;
  console.log(data);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("DeviceState");

    // Crear un objeto ObjectId a partir del ID proporcionado
    const objectId = new ObjectId("65eab39b61ff359e597d8a39");

    // Buscar el documento por su _id
    const existingDocument = await collection.findOne({ _id: objectId });
    if (!existingDocument) {
      console.error("Documento no encontrado en la base de datos");
      return res.status(404).send("Documento no encontrado en la base de datos");
    }

    // Actualizar el documento
    await collection.updateOne({ _id: objectId }, { $set: data });
    console.log("Documento actualizado en la base de datos");

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con un mensaje de confirmación
    res.send("Datos recibidos y guardados en la base de datos");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.get('/dispositivo', async (req, res) => {
  console.log("EntrogetDispositivo");
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("DeviceState");

    // Realizar la consulta a la colección de usuarios
    const usuarios = await collection.find({}).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(usuarios);
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.post('/InsertHistoric', async (req, res) => {
  const data = req.body;
  console.log(data);

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("DeviceHistoric");

    // Obtener la fecha y la hora actuales
    // Obtener la fecha y la hora actuales en la zona horaria deseada
    const fechaActual = new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' });

    // Obtener la fecha en formato AAAA-MM-DD
    const fecha = fechaActual.split(',')[0];

    // Obtener la hora en formato HH:MM:SS
    const hora = fechaActual.split(',')[1].trim();


    // Determinar el tipo de acción
    let accionRealizada = "";
    if (data.Accion === "MOVE") {
      accionRealizada = "Alimento Dispensado";
    } else if (data.Accion === "ON") {
      accionRealizada = "Agua Dispensada";
    } else {
      accionRealizada = "Otra acción"; // Puedes agregar un caso por defecto si lo necesitas
    }

    // Insertar los datos en la colección
    await collection.insertOne({
      Accion: accionRealizada,
      Hora: hora,
      Fecha: fecha,
    });
    console.log("Datos insertados en la base de datos");

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder a la ESP32 con un mensaje de confirmación
    res.send("Datos recibidos y guardados en la base de datos");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

/* 


  _   _ ____  _   _   _    ____  ___ ___  ____  
 | | | / ___|| | | | / \  |  _ \|_ _/ _ \/ ___| 
 | | | \___ \| | | |/ _ \ | |_) || | | | \___ \ 
 | |_| |___) | |_| / ___ \|  _ < | | |_| |___) |
  \___/|____/ \___/_/   \_\_| \_\___\___/|____/ 
                                                


*/
app.post('/GetUser', async (req, res) => {
  console.log("sientre");
  const { username, password } = req.body;
  console.log(username);
  console.log(password);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Users");

    // Verificar si el usuario existe en la colección
    const existingUser = await collection.findOne({ user: username, pass: password });
    if (existingUser) {
      console.log("Usuario Encontrado:", existingUser);
      // Respondemos con el usuario encontrado
      res.status(200).json(existingUser);
      return; // Terminar la ejecución de la función
    }

    // Si no se encuentra ningún usuario, respondemos con un mensaje indicando que no existe
    console.log("Usuario no encontrado");
    res.status(404).send("Usuario no encontrado");

  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.post('/Insert', async (req, res) => {
  const data = req.body;

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Users");

    // Verificar si el email ya existe en la colección
    const existingUser = await collection.findOne({ user: data.user });
    if (existingUser) {
      console.log("El email ya existe en la base de datos");
      // Responder con un mensaje de error
      res.status(400).send("El email ya existe en la base de datos");
      return; // Terminar la ejecución de la función
    }

    // Insertar los datos en la colección
    await collection.insertOne({
      ...data,
      Dispositivo: {
        // Aquí van los datos del dispositivo embebido
        // Por ejemplo:
        ID: "",
        // Otros campos del dispositivo...
      },
      Direccion: {
        Estado: "",
        Calle: "",
        Cp: "",
        N_Casa: "",
        Referencias: ""

      },
      permisos: "usuario"
    });
    console.log("Datos insertados en la base de datos");

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder a la ESP32 con un mensaje de confirmación
    res.send("Datos recibidos y guardados en la base de datos");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.get('/usuarios', async (req, res) => {
  console.log("entrepareverusaurios");
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Users");

    // Realizar la consulta a la colección de usuarios
    const usuarios = await collection.find({}).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(usuarios);
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.get('/getUserById/:id', async (req, res) => {
  console.log("Entre para revisar usuarios");
  console.log(req.params.id);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Users");

    // Obtener el ID del parámetro de la URL
    const userId = req.params.id;

    // Crear un nuevo ObjectID a partir del ID de usuario
    const objectId = new ObjectId(userId);

    // Realizar la consulta a la colección de usuarios por ID
    const usuario = await collection.findOne({ _id: objectId });

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con el resultado de la consulta
    if (usuario) {
      console.log(usuario);
      res.json(usuario);
    } else {
      res.status(404).send("Usuario no encontrado");
    }
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

app.delete('/delete/:id', async (req, res) => {
  const userId = req.params.id; // Obtener el ID del usuario a eliminar desde los parámetros de la solicitud
  console.log(userId);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Users");

    // Realizar la eliminación del usuario en la colección
    const result = await collection.deleteOne({ _id: new ObjectId(userId) });  // Suponiendo que el ID del usuario sea único

    // Verificar si se eliminó el usuario correctamente
    if (result.deletedCount === 1) {
      console.log("Usuario eliminado correctamente.");
      res.status(200).send("Usuario eliminado correctamente.");
    } else {
      console.log("El usuario no pudo ser encontrado o eliminado.");
      res.status(404).send("El usuario no pudo ser encontrado o eliminado.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

app.put('/editar/:id', async (req, res) => {
  console.log("entre para editar");
  const userId = req.params.id; // Obtener el ID del usuario a editar desde los parámetros de la solicitud
  const userData = req.body; // Obtener los datos del usuario a editar desde el cuerpo de la solicitud
  console.log(userId);
  console.log(userData);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Users");

    // Realizar la actualización del usuario en la colección
    const result = await collection.updateOne({ _id: new ObjectId(userId) }, { $set: userData });

    // Verificar si se actualizó el usuario correctamente
    if (result.modifiedCount === 1) {
      console.log("Usuario actualizado correctamente.");
      res.status(200).send("Usuario actualizado correctamente.");
    } else {
      console.log("El usuario no pudo ser encontrado o actualizado.");
      res.status(404).send("El usuario no pudo ser encontrado o actualizado.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.get('/getHistorial', async (req, res) => {
  console.log("¡Entré!");

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("DeviceHistoric");

    // Consultar todos los registros en la colección DeviceState
    const deviceStates = await collection.find({}).toArray();

    // Respondemos con los registros obtenidos
    res.status(200).json(deviceStates);
    console.log(deviceStates);

  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

app.post('/GetDispobyId', async (req, res) => {
  console.log("¡Entré!");
  const { username: id } = req.body;
  console.log(id);

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Users");

    // Verificar si el usuario existe en la colección
    const existingUser = await collection.findOne({ _id: new ObjectId(id) });
    if (existingUser) {
      console.log("¡Usuario Encontrado!");

      // Obtener el valor del campo "Dispositivo.ID" del usuario, manejar el caso nulo
      const dispositivoID = existingUser.Dispositivo ? existingUser.Dispositivo.ID : null ? existingUser.Dispositivo.ID : "";
      console.log("ID del Dispositivo:", dispositivoID);

      // Respondemos con el valor del campo "Dispositivo.ID" del usuario
      res.status(200).json({ dispositivoID });

      return; // Terminar la ejecución de la función
    }

    // Si no se encuentra ningún usuario, respondemos con un mensaje indicando que no existe
    console.log("Usuario no encontrado");
    res.status(404).send("Usuario no encontrado");

  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
/* 



  ____  _____ ____  _____ _____ _____    _    ____    ____   _    ____ ______        _____  ____  ____  
 |  _ \| ____/ ___|| ____|_   _| ____|  / \  |  _ \  |  _ \ / \  / ___/ ___\ \      / / _ \|  _ \|  _ \ 
 | |_) |  _| \___ \|  _|   | | |  _|   / _ \ | |_) | | |_) / _ \ \___ \___ \\ \ /\ / / | | | |_) | | | |
 |  _ <| |___ ___) | |___  | | | |___ / ___ \|  _ <  |  __/ ___ \ ___) |__) |\ V  V /| |_| |  _ <| |_| |
 |_| \_\_____|____/|_____| |_| |_____/_/   \_\_| \_\ |_| /_/   \_\____/____/  \_/\_/  \___/|_| \_\____/ 
                                                                                                        



*/
app.put('/resetPass/:id', async (req, res) => {
  const userId = req.params.id; // Obtener el ID del usuario a editar desde los parámetros de la solicitud
  const userData = req.body; // Obtener los datos del usuario a editar desde el cuerpo de la solicitud
  console.log(userId);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Users");

    // Realizar la actualización del usuario en la colección
    const result = await collection.updateOne({ _id: new ObjectId(userId) }, { $set: userData });

    // Verificar si se actualizó el usuario correctamente
    if (result.modifiedCount === 1) {
      console.log("Contraeña actualizada");
      res.status(200).send("Usuario actualizado correctamente.");
    } else {
      console.log("no se actializo la contra");
      res.status(404).send("El usuario no pudo ser encontrado o actualizado.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

// Configuracion del transporte
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "mascoteh9@gmail.com",
    pass: "zxxj wquz seop fazd",
  },
});
app.post('/email', (req, res) => {
  const { email } = req.body;
  const uniqueToken = uuid.v4().slice(0, 6);
  const mailOptions = {
    from: "mascoteh9@gmail.com",
    to: email,
    subject: 'Recuperacion de contraseña',
    text: ` Token unico para la recuperacion de contraseña: ${uniqueToken}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar el correo electrónico:', error);
      return res.status(500).json({ status: false, error: 'Error al enviar el correo electrónico', details: error });
    } else {
      console.log('Correo electrónico enviado:', info.response);
      return res.status(200).json({ status: true, message: 'Correo electrónico enviado exitosamente', token: uniqueToken });
    }
  });
});
app.post('/validateUser', async (req, res) => {
  console.log("sientre");
  const { username } = req.body;
  console.log(username);

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Users");

    // Verificar si el usuario existe en la colección
    const existingUser = await collection.findOne({ user: username });
    if (existingUser) {
      console.log("Usuario Encontrado:", existingUser);
      // Respondemos con el usuario encontrado
      res.status(200).json(existingUser);
      return; // Terminar la ejecución de la función
    }

    // Si no se encuentra ningún usuario, respondemos con un mensaje indicando que no existe
    console.log("Usuario no encontrado");
    res.status(404).send("Usuario no encontrado");

  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.post('/validateEmail', async (req, res) => {
  console.log("sientre al email");
  const { email: email } = req.body;
  console.log(email);

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Users");

    // Verificar si el usuario existe en la colección
    const existingUser = await collection.findOne({ email: email });
    if (existingUser) {
      console.log("Usuario Encontrado:", existingUser);
      // Respondemos con el usuario encontrado
      res.status(200).json(existingUser);
      return; // Terminar la ejecución de la función
    }

    // Si no se encuentra ningún usuario, respondemos con un mensaje indicando que no existe
    console.log("Usuario no encontrado");
    res.status(404).send("Usuario no encontrado");

  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.post('/validateAnswer', async (req, res) => {
  console.log("sientre");
  const { option, answer } = req.body;
  console.log(req.body);

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Users");

    // Verificar si la pregunta y respuesta coinciden con los datos en la base de datos
    const existingUser = await collection.findOne({ question: option, answer: answer });
    if (existingUser) {
      console.log("Datos encontrados", existingUser);
      // Respondemos con el usuario encontrado
      res.status(200).json(existingUser);
    } else {
      // Si no se encuentra ninguna coincidencia, respondemos con un mensaje indicando que los datos son incorrectos
      console.log("Datos incorrectos");
      res.status(404).send("Datos incorrectos");
    }

  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});



/* 


  ____  ____   ___  ____  _   _  ____ _____ ___  ____  
 |  _ \|  _ \ / _ \|  _ \| | | |/ ___|_   _/ _ \/ ___| 
 | |_) | |_) | | | | | | | | | | |     | || | | \___ \ 
 |  __/|  _ <| |_| | |_| | |_| | |___  | || |_| |___) |
 |_|   |_| \_\\___/|____/ \___/ \____| |_| \___/|____/ 
                                                       

*/
app.get('/productos', async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Products");


    const producto = await collection.find({}).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(producto);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).send("Error al obtener productos");
  }
});
app.post('/InsertProduct', upload.single('imagen'), async (req, res) => {
  console.log("entre en la ruta para insertar productos");

  try {
    // Extraer los datos del producto del cuerpo de la solicitud
    const data = req.body;

    // Verificar si se ha subido una imagen y obtener su URL de Cloudinary si es así
    let image = null;
    if (req.file) {
      image = req.file.path; // Obtener la URL de la imagen subida a Cloudinary
    }

    // Agregar la URL de la imagen a los datos del producto
    data.imagen = image;

    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Products");

    // Insertar los datos en la colección
    await collection.insertOne(data);

    console.log("Datos insertados en la base de datos");

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con un mensaje de confirmación
    res.send("Datos recibidos y guardados en la base de datos");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
// Agregar un nuevo producto

// Modificar la función para agregar productos en el cliente

app.get('/productos/:tipo', async (req, res) => {
  try {
    const tipo = req.params.tipo; // Obtener el tipo de producto desde la URL

    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Products");

    // Realizar la consulta a la colección de productos filtrando por el tipo
    const productos = await collection.find({ tipo: tipo }).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).send("Error al obtener productos");
  }
});


// Actualizar un producto existente
app.put('/productosedit/:id', upload.single('imagen'), async (req, res) => {
  const productId = req.params.id;
  const productData = req.body; // Obtener los datos del producto a editar desde el cuerpo de la solicitud

  try {
    // Verificar si se ha subido una nueva imagen
    if (req.file) {
      // Obtener la URL de la nueva imagen subida a Cloudinary y asignarla a productData
      productData.imagen = req.file.path;

      // Conectar a la base de datos MongoDB Atlas
      const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("Conexión exitosa a MongoDB Atlas");

      // Obtener una referencia a la base de datos y la colección
      const db = client.db("SensorData");
      const collection = db.collection("Products");

      // Obtener el producto actual para verificar si tiene una imagen anterior
      const existingProduct = await collection.findOne({ _id: new ObjectId(productId) });
      if (existingProduct && existingProduct.imagen) {
        // Eliminar la imagen anterior de Cloudinary
        await cloudinary.uploader.destroy(existingProduct.imagen); // Utiliza el método adecuado para eliminar la imagen de Cloudinary
      }

      // Realizar la actualización del producto en la colección
      const result = await collection.updateOne({ _id: new ObjectId(productId) }, { $set: productData });

      // Verificar si se actualizó el producto correctamente
      if (result.modifiedCount === 1) {
        console.log("Producto actualizado correctamente.");
        res.status(200).send("Producto actualizado correctamente.");
      } else {
        console.log("El producto no pudo ser encontrado o actualizado.");
        res.status(404).send("El producto no pudo ser encontrado o actualizado.");
      }

      // Cerrar la conexión
      client.close();
      console.log("Conexión cerrada");
    } else {
      // Si no se ha subido una nueva imagen, simplemente actualiza el producto sin eliminar la imagen anterior
      // Esto se puede hacer de manera similar a como lo estás haciendo actualmente
      // No es necesario realizar la eliminación de la imagen anterior en este caso

      // Conectar a la base de datos MongoDB Atlas
      const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("Conexión exitosa a MongoDB Atlas");

      // Obtener una referencia a la base de datos y la colección
      const db = client.db("SensorData");
      const collection = db.collection("Products");

      // Realizar la actualización del producto en la colección
      const result = await collection.updateOne({ _id: new ObjectId(productId) }, { $set: productData });

      // Verificar si se actualizó el producto correctamente
      if (result.modifiedCount === 1) {
        console.log("Producto actualizado correctamente.");
        res.status(200).send("Producto actualizado correctamente.");
      } else {
        console.log("El producto no pudo ser encontrado o actualizado.");
        res.status(404).send("El producto no pudo ser encontrado o actualizado.");
      }

      // Cerrar la conexión
      client.close();
      console.log("Conexión cerrada");
    }
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

// Eliminar un producto
app.delete('/productos/:id', async (req, res) => {
  const productId = req.params.id; // Obtener el ID del usuario a eliminar desde los parámetros de la solicitud
  console.log(productId);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Products");

    // Realizar la eliminación del usuario en la colección
    const result = await collection.deleteOne({ _id: new ObjectId(productId) });  // Suponiendo que el ID del usuario sea único

    // Verificar si se eliminó el usuario correctamente
    if (result.deletedCount === 1) {
      console.log("Producto eliminado correctamente.");
      res.status(200).send("Producto eliminado correctamente.");
    } else {
      console.log("El Producto no pudo ser encontrado o eliminado.");
      res.status(404).send("El Producto no pudo ser encontrado o eliminado.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

app.get('/getDetails/:id', async (req, res) => {
  const productId = req.params.id; // Obtener el ID del usuario a editar desde los parámetros de la solicitud
  // Obtener los datos del usuario a editar desde el cuerpo de la solicitud
  console.log(productId);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Products");

    // Realizar la actualización del usuario en la colección
    const result = await collection.findOne({ _id: new ObjectId(productId) });
    // Verificar si se actualizó el usuario correctamente
    console.log(result);
    console.log("Producto encontrado correctamente.");
    res.json(result);

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta




  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});




/* 


   ___  _   _ ___ _____ _   _ _____ ____    ____   ___  __  __  ___  ____    ___ 
  / _ \| | | |_ _| ____| \ | | ____/ ___|  / ___| / _ \|  \/  |/ _ \/ ___|  |__ \
 | | | | | | || ||  _| |  \| |  _| \___ \  \___ \| | | | |\/| | | | \___ \    / /
 | |_| | |_| || || |___| |\  | |___ ___) |  ___) | |_| | |  | | |_| |___) |  |_| 
  \__\_\\___/|___|_____|_| \_|_____|____/  |____/ \___/|_|  |_|\___/|____/   (_) 
                                                                                 



*/
app.get('/getQn', async (req, res) => {

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("QuienesSomos");

    // Realizar la consulta a la colección de usuarios
    const Qns = await collection.find({}).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(Qns);
    console.log(Qns);
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

//Editar
app.put('/quienesSomosEdit/:id', async (req, res) => {
  const QSId = req.params.id; // Obtener el ID de los datos a editar desde los parámetros de la solicitud
  const datos = req.body; // Obtener los datos a editar desde el cuerpo de la solicitud
  console.log(datos);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("QuienesSomos");

    // Realizar la actualización de los datos en la colección
    const result = await collection.updateOne({ _id: new ObjectId(QSId) }, { $set: datos });

    // Verificar si se actualizó correctamente
    if (result.modifiedCount === 1) {
      console.log("Datos actualizados correctamente.");
      res.status(200).send("Datos actualizados correctamente.");
    } else {
      console.log("Los datos no pudieron ser encontrados o actualizados.");
      res.status(404).send("Los datos no pudieron ser encontrados o actualizados.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

/*

  ____   ___  _     ___ _____ ___ ____    _    ____  
 |  _ \ / _ \| |   |_ _|_   _|_ _/ ___|  / \  / ___| 
 | |_) | | | | |    | |  | |  | | |     / _ \ \___ \ 
 |  __/| |_| | |___ | |  | |  | | |___ / ___ \ ___) |
 |_|    \___/|_____|___| |_| |___\____/_/   \_\____/ 
                                                     


*/

app.get('/getPoliticas', async (req, res) => {

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Politicas");

    // Realizar la consulta a la colección de POLITICAS
    const politicas = await collection.find({}).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(politicas);
    console.log(politicas);
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

//Editar politicas
app.put('/PoliticasEdit/:id', async (req, res) => {
  const poli = req.params.id; // Obtener el ID de los datos a editar desde los parámetros de la solicitud
  const datos = req.body; // Obtener los datos a editar desde el cuerpo de la solicitud
  console.log(datos);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Politicas");

    // Realizar la actualización de los datos en la colección
    const result = await collection.updateOne({ _id: new ObjectId(poli) }, { $set: datos });

    // Verificar si se actualizó correctamente
    if (result.modifiedCount === 1) {
      console.log("Datos actualizados correctamente.");
      res.status(200).send("Datos actualizados correctamente.");
    } else {
      console.log("Los datos no pudieron ser encontrados o actualizados.");
      res.status(404).send("Los datos no pudieron ser encontrados o actualizados.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});


// Eliminar datos de la empresa
app.delete('/EliminarDatos/:id', async (req, res) => {
  console.log("Datos ente");
  const DatosId = req.params.id; // Obtener el ID del usuario a eliminar desde los parámetros de la solicitud
  console.log(DatosId);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("QuienesSomos");

    // Realizar la eliminación de la politica en la colección
    const result = await collection.deleteOne({ _id: new ObjectId(DatosId) });  // Suponiendo que el ID del usuario sea único

    // Verificar si se eliminó la politica correctamente
    if (result.deletedCount === 1) {
      console.log("Datos eliminados correctamente.");
      res.status(200).send("Datos eliminados correctamente.");
    } else {
      console.log("Los datos no pudieron ser encontrados o eliminados.");
      res.status(404).send("Los datos no pudieron ser encontrados o eliminados.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

// Eliminar una politica
app.delete('/deletep/:id', async (req, res) => {
  console.log("politicas ente");
  const politicaId = req.params.id; // Obtener el ID del usuario a eliminar desde los parámetros de la solicitud
  console.log(politicaId);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Politicas");

    // Realizar la eliminación de la politica en la colección
    const result = await collection.deleteOne({ _id: new ObjectId(politicaId) });  // Suponiendo que el ID del usuario sea único

    // Verificar si se eliminó la politica correctamente
    if (result.deletedCount === 1) {
      console.log("Politica eliminada correctamente.");
      res.status(200).send("Politica eliminada correctamente.");
    } else {
      console.log("La politica no pudo ser encontrada o eliminada.");
      res.status(404).send("La politica no pudo ser encontrado o eliminado.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

// Agregar una nueva politica
app.post('/InsertarPolitica', async (req, res) => {

  const data = req.body;
  console.log(data);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Politicas");
    // Insertar los datos en la colección
    await collection.insertOne({ ...data }); // Establecer permisos de usuario automáticamente

    console.log("Datos insertados en la base de datos");

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder a la ESP32 con un mensaje de confirmación
    res.send("Datos recibidos y guardados en la base de datos");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

/* 

 __     _____ ____ ___ ___  _   _ 
 \ \   / /_ _/ ___|_ _/ _ \| \ | |
  \ \ / / | |\___ \| | | | |  \| |
   \ V /  | | ___) | | |_| | |\  |
    \_/  |___|____/___\___/|_| \_|
                                  


 */
app.get('/getVision', async (req, res) => {

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Vision");

    // Realizar la consulta a la colección de POLITICAS
    const politicas = await collection.find({}).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(politicas);
    console.log(politicas);
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

app.put('/VisionEdit/:id', async (req, res) => {
  const vision = req.params.id; // Obtener el ID de los datos a editar desde los parámetros de la solicitud
  const datos = req.body; // Obtener los datos a editar desde el cuerpo de la solicitud
  console.log(datos);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Vision");

    // Realizar la actualización de los datos en la colección
    const result = await collection.updateOne({ _id: new ObjectId(vision) }, { $set: datos });

    // Verificar si se actualizó correctamente
    if (result.modifiedCount === 1) {
      console.log("Datos actualizados correctamente.");
      res.status(200).send("Datos actualizados correctamente.");
    } else {
      console.log("Los datos no pudieron ser encontrados o actualizados.");
      res.status(404).send("Los datos no pudieron ser encontrados o actualizados.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});






/* 
 
   __  __ ___ ____ ___ ___  _   _ 
 |  \/  |_ _/ ___|_ _/ _ \| \ | |
 | |\/| || |\___ \| | | | |  \| |
 | |  | || | ___) | | |_| | |\  |
 |_|  |_|___|____/___\___/|_| \_|
                                 
 
 
 
*/
app.get('/getMision', async (req, res) => {

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Mision");

    // Realizar la consulta a la colección de POLITICAS
    const politicas = await collection.find({}).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(politicas);
    console.log(politicas);
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

app.put('/MisionEdit/:id', async (req, res) => {
  const poli = req.params.id; // Obtener el ID de los datos a editar desde los parámetros de la solicitud
  const datos = req.body; // Obtener los datos a editar desde el cuerpo de la solicitud
  console.log(datos);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Mision");

    // Realizar la actualización de los datos en la colección
    const result = await collection.updateOne({ _id: new ObjectId(poli) }, { $set: datos });

    // Verificar si se actualizó correctamente
    if (result.modifiedCount === 1) {
      console.log("Datos actualizados correctamente.");
      res.status(200).send("Datos actualizados correctamente.");
    } else {
      console.log("Los datos no pudieron ser encontrados o actualizados.");
      res.status(404).send("Los datos no pudieron ser encontrados o actualizados.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});




/*



   ____ ___  _   _ _____  _    ____ _____ ___  
  / ___/ _ \| \ | |_   _|/ \  / ___|_   _/ _ \ 
 | |  | | | |  \| | | | / _ \| |     | || | | |
 | |__| |_| | |\  | | |/ ___ \ |___  | || |_| |
  \____\___/|_| \_| |_/_/   \_\____| |_| \___/ 
                                               



*/

app.post('/InsertarContacto', async (req, res) => {

  const { user, email, comentario, direccion } = req.body;
  console.log(req.body);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Comentarios");

    // Insertar los datos en la colección
    await collection.insertOne({
      user,
      email,
      comentario,
    });
    console.log("Datos insertados en la base de datos");

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder a la ESP32 con un mensaje de confirmación
    res.send("Datos recibidos y guardados en la base de datos");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.get('/getContac', async (req, res) => {

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Contacto");

    // Realizar la consulta a la colección de usuarios
    const contac = await collection.find({}).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(contac);
    console.log(contac);
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

//Editar
app.put('/ContactoEdit/:id', async (req, res) => {
  const contac = req.params.id; // Obtener el ID de los datos a editar desde los parámetros de la solicitud
  const datos = req.body; // Obtener los datos a editar desde el cuerpo de la solicitud
  console.log(datos);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Contacto");

    // Realizar la actualización de los datos en la colección
    const result = await collection.updateOne({ _id: new ObjectId(contac) }, { $set: datos });

    // Verificar si se actualizó correctamente
    if (result.modifiedCount === 1) {
      console.log("Datos actualizados correctamente.");
      res.status(200).send("Datos actualizados correctamente.");
    } else {
      console.log("Los datos no pudieron ser encontrados o actualizados.");
      res.status(404).send("Los datos no pudieron ser encontrados o actualizados.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.delete('/deleteContacto/:id', async (req, res) => {
  console.log("politicas ente");
  const politicaId = req.params.id; // Obtener el ID del usuario a eliminar desde los parámetros de la solicitud
  console.log(politicaId);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Contacto");

    // Realizar la eliminación de la politica en la colección
    const result = await collection.deleteOne({ _id: new ObjectId(politicaId) });  // Suponiendo que el ID del usuario sea único

    // Verificar si se eliminó la politica correctamente
    if (result.deletedCount === 1) {
      console.log("Politica eliminada correctamente.");
      res.status(200).send("Politica eliminada correctamente.");
    } else {
      console.log("La politica no pudo ser encontrada o eliminada.");
      res.status(404).send("La politica no pudo ser encontrado o eliminado.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});




/* 


  _____ ___  _   _ ___ ____   ___  
 | ____/ _ \| | | |_ _|  _ \ / _ \ 
 |  _|| | | | | | || || |_) | | | |
 | |__| |_| | |_| || ||  __/| |_| |
 |_____\__\_\\___/|___|_|    \___/ 
                                   

*/
app.post('/InsertarElemento', uploadTeam.single('imagen'), async (req, res) => {
  console.log("entre en la ruta para insertar productos");

  try {
    // Extraer los datos del producto del cuerpo de la solicitud
    const data = req.body;

    // Verificar si se ha subido una imagen y obtener su URL de Cloudinary si es así
    let image = null;
    if (req.file) {
      image = req.file.path; // Obtener la URL de la imagen subida a Cloudinary
    }

    // Agregar la URL de la imagen a los datos del producto
    data.imagen = image;

    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Team");

    // Insertar los datos en la colección
    await collection.insertOne(data);

    console.log("Datos insertados en la base de datos");

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con un mensaje de confirmación
    res.send("Datos recibidos y guardados en la base de datos");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.get('/getTeam', async (req, res) => {

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Team");

    // Realizar la consulta a la colección de usuarios
    const contac = await collection.find({}).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(contac);
    console.log(contac);
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

//Editar
app.put('/teamEdit/:id', uploadTeam.single('imagen'), async (req, res) => {
  const teamId = req.params.id;
  const teamData = req.body; // Obtener los datos del producto a editar desde el cuerpo de la solicitud

  try {
    // Verificar si se ha subido una nueva imagen
    if (req.file) {
      // Obtener la URL de la nueva imagen subida a Cloudinary y asignarla a productData
      teamData.imagen = req.file.path;

      // Conectar a la base de datos MongoDB Atlas
      const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("Conexión exitosa a MongoDB Atlas");

      // Obtener una referencia a la base de datos y la colección
      const db = client.db("SensorData");
      const collection = db.collection("Team");

      // Obtener el producto actual para verificar si tiene una imagen anterior
      const existingProduct = await collection.findOne({ _id: new ObjectId(teamId) });
      if (existingProduct && existingProduct.imagen) {
        // Eliminar la imagen anterior de Cloudinary
        await cloudinary.uploader.destroy(existingProduct.imagen); // Utiliza el método adecuado para eliminar la imagen de Cloudinary
      }

      // Realizar la actualización del producto en la colección
      const result = await collection.updateOne({ _id: new ObjectId(teamId) }, { $set: teamData });

      // Verificar si se actualizó el producto correctamente
      if (result.modifiedCount === 1) {
        console.log("Producto actualizado correctamente.");
        res.status(200).send("Producto actualizado correctamente.");
      } else {
        console.log("El producto no pudo ser encontrado o actualizado.");
        res.status(404).send("El producto no pudo ser encontrado o actualizado.");
      }

      // Cerrar la conexión
      client.close();
      console.log("Conexión cerrada");
    } else {
      // Si no se ha subido una nueva imagen, simplemente actualiza el producto sin eliminar la imagen anterior
      // Esto se puede hacer de manera similar a como lo estás haciendo actualmente
      // No es necesario realizar la eliminación de la imagen anterior en este caso
    }
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});


/* 

   ____ ___  __  __ _____ _   _ _____  _    ____  ___ ___  ____  
  / ___/ _ \|  \/  | ____| \ | |_   _|/ \  |  _ \|_ _/ _ \/ ___| 
 | |  | | | | |\/| |  _| |  \| | | | / _ \ | |_) || | | | \___ \ 
 | |__| |_| | |  | | |___| |\  | | |/ ___ \|  _ < | | |_| |___) |
  \____\___/|_|  |_|_____|_| \_| |_/_/   \_\_| \_\___\___/|____/ 
                                                                 



*/
app.get('/getComentarios', async (req, res) => {

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Comentarios");

    // Realizar la consulta a la colección de usuarios
    const contac = await collection.find({}).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(contac);
    console.log(contac);
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.put('/ComentarioEdit/:id', async (req, res) => {
  const contac = req.params.id; // Obtener el ID de los datos a editar desde los parámetros de la solicitud
  const datos = req.body; // Obtener los datos a editar desde el cuerpo de la solicitud
  console.log(datos);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Comentarios");

    // Realizar la actualización de los datos en la colección
    const result = await collection.updateOne({ _id: new ObjectId(contac) }, { $set: datos });

    // Verificar si se actualizó correctamente
    if (result.modifiedCount === 1) {
      console.log("Datos actualizados correctamente.");
      res.status(200).send("Datos actualizados correctamente.");
    } else {
      console.log("Los datos no pudieron ser encontrados o actualizados.");
      res.status(404).send("Los datos no pudieron ser encontrados o actualizados.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.delete('/deleteComentario/:id', async (req, res) => {

  const coment = req.params.id; // Obtener el ID del usuario a eliminar desde los parámetros de la solicitud
  console.log(coment);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("Comentarios");

    // Realizar la eliminación de la politica en la colección
    const result = await collection.deleteOne({ _id: new ObjectId(coment) });  // Suponiendo que el ID del usuario sea único

    // Verificar si se eliminó la politica correctamente
    if (result.deletedCount === 1) {
      console.log("datos eliminados correctamente.");
      res.status(200).send("data eliminada correctamente.");
    } else {
      console.log("los datos no pudo ser encontrada o eliminada.");
      res.status(404).send("los datos no pudo ser encontrado o eliminado.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

/* 
  ____                             _              _____                               _            
 |  _ \ _ __ ___  __ _ _   _ _ __ | |_ __ _ ___  |  ___| __ ___  ___ _   _  ___ _ __ | |_ ___  ___ 
 | |_) | '__/ _ \/ _` | | | | '_ \| __/ _` / __| | |_ | '__/ _ \/ __| | | |/ _ \ '_ \| __/ _ \/ __|
 |  __/| | |  __/ (_| | |_| | | | | || (_| \__ \ |  _|| | |  __/ (__| |_| |  __/ | | | ||  __/\__ \
 |_|   |_|  \___|\__, |\__,_|_| |_|\__\__,_|___/ |_|  |_|  \___|\___|\__,_|\___|_| |_|\__\___||___/
                 |___/                                                                             

*/
app.post('/InsertarPregunta', async (req, res) => {

  const data = req.body;
  console.log(req.body);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("PreguntasFrecuentes");

    // Insertar los datos en la colección
    await collection.insertOne({
      ...data
    });
    console.log("Datos insertados en la base de datos");

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder a la ESP32 con un mensaje de confirmación
    res.send("Datos recibidos y guardados en la base de datos");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.get('/getPreguntas', async (req, res) => {

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("PreguntasFrecuentes");

    // Realizar la consulta a la colección de usuarios
    const contac = await collection.find({}).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(contac);
    console.log(contac);
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.put('/PreguntasEdit/:id', async (req, res) => {
  const contac = req.params.id; // Obtener el ID de los datos a editar desde los parámetros de la solicitud
  const datos = req.body; // Obtener los datos a editar desde el cuerpo de la solicitud
  console.log(datos);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("PreguntasFrecuentes");

    // Realizar la actualización de los datos en la colección
    const result = await collection.updateOne({ _id: new ObjectId(contac) }, { $set: datos });

    // Verificar si se actualizó correctamente
    if (result.modifiedCount === 1) {
      console.log("Datos actualizados correctamente.");
      res.status(200).send("Datos actualizados correctamente.");
    } else {
      console.log("Los datos no pudieron ser encontrados o actualizados.");
      res.status(404).send("Los datos no pudieron ser encontrados o actualizados.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});
app.delete('/deletePreguntas/:id', async (req, res) => {

  const coment = req.params.id; // Obtener el ID del usuario a eliminar desde los parámetros de la solicitud
  console.log(coment);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("SensorData");
    const collection = db.collection("PreguntasFrecuentes");

    // Realizar la eliminación de la politica en la colección
    const result = await collection.deleteOne({ _id: new ObjectId(coment) });  // Suponiendo que el ID del usuario sea único

    // Verificar si se eliminó la politica correctamente
    if (result.deletedCount === 1) {
      console.log("datos eliminados correctamente.");
      res.status(200).send("data eliminada correctamente.");
    } else {
      console.log("los datos no pudo ser encontrada o eliminada.");
      res.status(404).send("los datos no pudo ser encontrado o eliminado.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});








// Manejar errores 404 para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).send("Ruta no encontrada");
});

// Manejar errores 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Error del servidor');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor Node.js escuchando en http://localhost:${port}`);
});

/* Quienes somos */
