const PORT = process.env.PORT || 5000
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const app = express();
const cors = require('cors');
var server = app.listen(PORT);
const axios = require('axios');
var fs = require('fs');

app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({extended: true,limit: '100mb'}));
app.use(cors());
////////////////////////////////////////////////PATHS///////////////////////////////////////////////////

app.get('/', function(req, res) {
  res.end();
});
