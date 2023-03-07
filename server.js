const config = require('./config');
const express = require("express");
const app = express();
const bodyParser = require('body-parser')
const mongoose = require('mongoose'); 
const routes = require("./routes")

//mongoose
mongoose.set("strictQuery", false);
mongoose.connect('mongodb://127.0.0.1/nodejs_api',{useNewUrlParser:true});
mongoose.Promise = global.Promise;

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true }))  // to support URL-encoded bodies

app.use('/api/',routes)

app.use((req, res, next) => {
    res.status(404).send("not found");
  });

// Server setup
app.listen(config.port, () => {
  console.log("server running");
});