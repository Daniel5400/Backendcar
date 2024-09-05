const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv/config');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
const corsOptions = {
    origin: ["https://sogvehiclerentals.netlify.app", "http://localhost:3001", "http://localhost:3000","*"]
  };

// Middleware
app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan('tiny'));

// Static file serving should be placed before JWT middleware
app.use('/public/carsimg', express.static(__dirname + '/public/carsimg'));

// JWT Middleware
app.use(authJwt());

// Error Handling Middleware
app.use(errorHandler);

// Routes
const carsRoutes = require('./routes/cars');
const bookingsRoutes = require('./routes/bookings');
const usersRoutes = require('./routes/users');
const paymentsRoutes = require('./routes/payments');

const api = process.env.API_URL;

app.use(`${api}/cars`, carsRoutes);
app.use(`${api}/bookings`, bookingsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/payments`, paymentsRoutes);

// Database
mongoose
    .connect(process.env.CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'rentals-db',
    })
    .then(() => {
        console.log('Database Connection is ready...');
    })
    .catch((err) => {
        console.log(err);
    });

// Server
app.listen(3000, () => {
    console.log('server is running http://localhost:3000');
});
