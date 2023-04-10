require('dotenv').config();

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const multer = require('multer');

const feeedRoutes = require('./routes/feed')

const app = express();

const { v4: uuidv4 } = require('uuid');
 
const fileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'images');
    },
    filename: function(req, file, cb) {
        cb(null, uuidv4())
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

//app.use(bodyParser.urlencoded());   => for data  x-www-form-urlendoded.
app.use(bodyParser.json()); //=> to parse data in JSON format

app.use(
    multer({storage: fileStorage, fileFilter: fileFilter}).single('image')
);

app.use('/images', express.static(path.join(__dirname,'images')));

//we add headers in order to not have CORS errors, we create new middleware:
app.use((req, res, next) => {
    //we allow access to our data to specific origins *-all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    //we call next, so the request can continue
    next();
});

//forward every request starting with '/feed' to the feedRoutes
app.use('/feed',feeedRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message
    res.status(status).json({message: message});
});


mongoose.connect(
    process.env.MONGO_URL
    )
    .then(result => {
        app.listen(8080);
    })
    .catch(err => {
        console.log(err);
    });


