require('dotenv').config();

const fs = require('fs');

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const multer = require('multer');

const { graphqlHTTP  } = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');

const auth = require('./middleware/auth');

// const feeedRoutes = require('./routes/feed');
// const authRoutes = require('./routes/auth');

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

//we add headers in order to not have ¡CORS ERRORS!, we create new middleware:
app.use((req, res, next) => {
    //we allow access to our data to specific origins *-all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    //we call next, so the request can continue
    next();
});


app.use(auth);

app.put('/post-image', (req, res, next) => {
    if (!req.isAuth) {
        throw new Error('User not authenticated');
    }

    if (!req.file) {
        return res.status(200).json({message: 'No file provided'})
    }

    if (req.body.oldPath){
        clearImage(req.body.oldPath);
    }

    return res.status(201)
    .json({message: 'File successfully stored', filePath: req.file.path.replace(/\\/g, "/")});
});


app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(err) {
        if (!err.originalError) {
            return err;
        }

        const data = err.originalError.data;
        const message = err.message || 'An error ocurred.';
        const code = err.originalError.code;

        return { message: message, status: code, data: data }
    }
}));

//forward every request starting with '/feed' to the feedRoutes
// app.use('/feed',feeedRoutes);

// app.use('/auth',authRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message
    const data = error.data;
    res.status(status).json({message: message, data: data});
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


const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}