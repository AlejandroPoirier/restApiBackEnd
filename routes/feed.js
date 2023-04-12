const express = require('express');

// import the 'check' module and assings its body property
//to a variable named body using destructuring ´{}´

//{The curly braces in the syntax indicate object destructuring,
//a feature introduced in ES6 that allows extracting properties from 
//objects and binding them to variables with the same name.}

//'body' is a function that performs validation checks on
//request bodies  in an Express.js application
const { body } = require('express-validator');

const feedController = require('../controllers/feed');

const router = express.Router();

// GET /feed/posts
router.get('/posts', feedController.getPosts);

// POST /feed/post
router.post('/post', [
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
],feedController.createPosts);


router.get('/post/:postId', feedController.getPost);

router.put('/post/:postId',[
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
], feedController.updatePost);


router.delete('/post/:postId', feedController.deletePost);

module.exports = router;