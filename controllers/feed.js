const fs = require('fs');
const path = require('path');

const {validationResult} = require('express-validator')

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    //while usign the REST arquitecture, we don´t return HTML,
    //so we won´t be using res.render() method.
    //instead we'll use res.json()

    // we should assing the status code also

    Post.find()
    .then(posts => {
        res.status(200).json({
            message: 'Fetched post successfully.', 
            posts: posts})
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })

    // res.status(200).json({
    //     posts: [{
    //         _id: '1',
    //         title:'FP',
    //         content: 'First post content',
    //         imageUrl:'images/smileyFace.webp',
    //         creator: {
    //             name: 'GPA',
    //         },
    //         createdAt: new Date(),
    //     }]
    // });
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

    if(!req.file){
        const error = new Error('No image selected to upload');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path.replace("\\" ,"/");

    //Create post in DB
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
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


exports.getPost = (req, res, next) => {
    const postId = req.params.postId;

    Post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error('Could not find post')
            error.statusCode=404;
            throw error;
        }

        res.status(200).json({message: 'Post fetched.', post: post})
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
};


exports.updatePost = (req, res, next) => {
    const errors = validationResult(req);

    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;

    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, error while updating data');
        error.statusCode = 422;
        throw error;
    }

    if(req.file){
        imageUrl = req.file.path.replace("\\","/");
    }
    if(!imageUrl){
        const error = new Error('No file picked')
        error.statusCode = 422;
        throw error
    }
    
    Post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error('Post not available to update');
            error.statusCode = 404;
            throw error;
        }
        if(imageUrl !== post.imageUrl){
            clearImage(post.imageUrl);
        }
        //if there in no errors, then we can update the post Data
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        return post.save();
    })
    .then(result => {
        res.status(200).json({message: 'Post updated!', post: result})
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
};


exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    
    Post.findById(postId)
    .then(post => {
        //Check if the creator is the current user
        //so it can be deleted.
        if(!post){
            const error = new Error('Could not find post')
            error.statusCode=404;
            throw error;
        }

        clearImage(post.imageUrl)
        return Post.findByIdAndRemove(postId);
    })
    .then(result => {
        console.log('Post deleted successfully')
        res.status(200).json({message: 'Post deleted!', post: result})
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
}


const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}