const express = require('express');

const feeedRoutes = require('./routes/feed')

const app = express()

//forward every request starting with '/feed' to the feedRoutes
app.use('/feed',feeedRoutes);

app.listen(8080);

