const { APP_PORT } = require("./config.json"); 

const express = require('express');
const morgan  = require('morgan');
const cors = require('cors');
const app = express();

const { mongoose } = require('./database');

// Settings

// Middlewares

app.use(morgan('dev'));
app.use(express.json());
app.use(cors({origin: 'http://localhost:4200'}));

// Routes

app.use('/api/budgets', require("./routes/budgets.routes"));


// Starting the server

app.listen(APP_PORT, ()=> {
    console.log(`Server initialized in port ${APP_PORT}`);
});