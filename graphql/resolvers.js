const bcrypt = require('bcryptjs');
const validator =  require('validator');
const jwt = require('jsonwebtoken');

const path = require('path');
const fs = require('fs');

const User = require('../models/user');
const Post = require('../models/post');



module.exports = {

    //This syntax is used to define methods within an object.
    //this way we can export 1 object with all the functions inside
    //key: function, Each function is assigned as a value to a property of the object being exported.
    createUser: async function({userInput}, req) {

        
        const errors = [];

        if (!validator.isEmail(userInput.email)) {
            errors.push({message: 'Invalid Email'});
        }

        if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })
        ) {
            errors.push({ message: "Password field empty or is too short" });
        }

        if (errors.length > 0) {
            const error = new Error('Invalid input')
            error.data = errors;
            error.code = 422;
            throw error;
        }

        const existingUser = await User.findOne({email: userInput.email});

        if (existingUser) {
            const error = new Error('Email already in use');
            throw error;
        }

        const hashedPw = await bcrypt.hash(userInput.password, 12);

        const user = new User ({
            email: userInput.email,
            name: userInput.name,
            password: hashedPw
        })

        const createdUser = await user.save();

        //createdUser._doc will contain just the user data
        //without the mongoose metadata
        return {...createdUser._doc, _id: createdUser._id.toString()}
    },

    login: async function({email, password}) {

        const user = await User.findOne({email: email});
        
        if(!user) {
            const err = new Error('This email was not registered');
            error.code = 401;
            throw err;
        }

        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual){
            const err = new Error('Wrong password, please try again');
            error.code = 401;
            throw err;
        }

        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email.toString()
        }, 'somesupersecretsecret', { expiresIn: '1h' });

        return { token: token, userId: user._id.toString() };
    },

    createPost: async function({ postInput }, req) {

        if (!req.isAuth) {
            const err = new Error('User is not authorized, please authenticate');
            err.code = 401;
            throw err
        }

        const errors = [];

        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
            error.push({message: "Title is empty or it is too short, min 5 characters."})
        }

        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
            error.push({message: "Content is empty or it is too short, min 5 characters."})
        }

        if (errors.length > 0) {
            const err = new Error('You have 1 or more invalid inputs');
            err.data = errors;
            err.code = 422;
            throw err
        }

        const user = await User.findById(req.userId);

        if(!user){
            const err = new Error('User not found.')
            err.code = 401;
            throw err;
        }

        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: user
        })

        const createdPost = await post.save();
        user.post.push(createdPost);

        await user.save()

        //this way we overwrite the ID field in order to be a string instead of an object
        return { ...createdPost._doc,
                _id: createdPost._id.toString(),
                createdAt: createdPost.createdAt.toISOString(),
                updatedAt: createdPost.updatedAt.toISOString()
            }
    },

    posts: async function({page}, req) {
        if (!req.isAuth) {
            const err = new Error('User is not authorized, please authenticate');
            err.code = 401;
            throw err
        }

        if (!page) {
            page = 1;
        }

        const perPage = 2;

        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('creator');

        // const postToString = [...posts].map((post) => {
        //     return 
        // })
        
        return { posts: posts.map(singlePost => {
            return {
                ...singlePost._doc,
                _id: singlePost._id.toString(),
                createdAt: singlePost.createdAt.toISOString(),
                updatedAt: singlePost.updatedAt.toISOString()
            };
        }), totalPosts: totalPosts }
    },


    post: async function({id}, req) {
        if (!req.isAuth) {
            const err = new Error('User is not authorized, please authenticate');
            err.code = 401;
            throw err
        }

        const post = await Post.findById(id).populate('creator');
        
        if(!post){
            const err = new Error('Post not found');
            err.code = 404;
            throw err 
        }

        return { ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()}
    },

    updatePost: async function({id, postInput}, req) {
        if (!req.isAuth) {
            const err = new Error('User is not authorized, please authenticate');
            err.code = 401;
            throw err
        }

        const post = await Post.findById(id).populate('creator');

        if(!post){
            const err = new Error('Post not found, you cannot modify it.')
            err.code = 404;
            throw err;
        }

        console.log(post.creator._id.toString(), req.userId.toString())

        if (post.creator._id.toString() !== req.userId.toString()) {
            const err = new Error('You cannot edit this post')
            err.code = 403;
            throw err;
        }

        const errors = [];

        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
            error.push({message: "Title is empty or it is too short, min 5 characters."})
        }

        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
            error.push({message: "Content is empty or it is too short, min 5 characters."})
        }

        if (errors.length > 0) {
            const err = new Error('You have 1 or more invalid inputs');
            err.data = errors;
            err.code = 422;
            throw err
        }

        post.title = postInput.title;
        post.content = postInput.content;
        if (postInput.imageUrl !== 'undefined') {
            post.imageUrl = postInput.imageUrl;
        }

        const updatedPost = await post.save()

        return { ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()}
    },

    deletePost: async function({id}, req){

        if (!req.isAuth) {
            const err = new Error('User is not authorized, please authenticate');
            err.code = 401;
            throw err
        }

        const post = await Post.findById(id).populate('creator');
        

        if (!post) {
            const err = new Error('Unable to delete post');
            err.code = 404;
            throw err
        }

        if (post.creator._id.toString() !== req.userId.toString()) {
            const err = new Error(`You cannot edit this post
            1:${post.creator.toString()} !== ${req.userId.toString()}`)
            err.code = 403;
            throw err;
        }

        clearImage(post.imageUrl);

        await Post.findByIdAndDelete(id);

        const user = await User.findById(req.userId);
        user.post.pull(id);
        await user.save()
        
        return true;
    
    },
    user: async function(args, req){
        if (!req.isAuth) {
            const err = new Error('User is not authorized, please authenticate');
            err.code = 401;
            throw err
        }

        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            const err = new Error('User not found');
            err.code = 401;
            throw err
        }

        return { ...user._doc,
            _id: user._id.toString(),
        }

    },

    updateStatus: async function({status}, req){
        if (!req.isAuth) {
            const err = new Error('User is not authorized, please authenticate');
            err.code = 401;
            throw err
        }

        const user = await User.findById(req.userId);

        if(!user){
            const err = new Error('User not found')
            err.code = 401;
            throw err;
        }

        user.status = status;

        await user.save()

        return { ...user._doc,
            _id: user._id.toString(),
        }
    }
}


const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}