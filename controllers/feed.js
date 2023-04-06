const {validationResult} = require('express-validator')

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    //while usign the REST arquitecture, we don´t return HTML,
    //so we won´t be using res.render() method.
    //instead we'll use res.json()

    // we should assing the status code also
    res.status(200).json({
        posts: [{
            _id: '1',
            title:'FP',
            content: 'First post content',
            imageUrl:'images/smileyFace.webp',
            creator: {
                name: 'GPA',
            },
            createdAt: new Date(),
        }]
    });
};


exports.createPosts = (req,res, next) => {
    const errors = validationResult(req);

    //si tenemos errores, se devolver un mensaje
    //de error + los errores en forma de array
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;

    //Create post in DB
    const post = new Post({
        title: title,
        content: content,
        imageURL: 'images/smileyFace.webp',
        creator: {
            name: 'Alejandro',
        }
    });

    post.save()
    .then(result => {
        console.log(result);

        // 200 - Success.
        // 201 -Success, a resource was created.
        res.status(201).json({
            message: 'Post created successfully!',
            post: result
        });
    })
    .catch(err => {
        // console.log(err)
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
}