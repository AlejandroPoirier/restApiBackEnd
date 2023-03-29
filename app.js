const express = require('express');

const bodyParser = require('body-parser');

const feeedRoutes = require('./routes/feed')

const app = express()

//app.use(bodyParser.urlencoded());   => for data  x-www-form-urlendoded.
app.use(bodyParser.json()); //=> to parse data in JSON format

//forward every request starting with '/feed' to the feedRoutes
app.use('/feed',feeedRoutes);

app.listen(8080);

