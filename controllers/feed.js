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
    const title = req.body.title;
    const content = req.body.content;

    //Create post in DB

    // 200 - Success.
    // 201 -Success, a resource was created.
    res.status(201).json({
        message: 'Post created successfully!',
        post: {
            _id: new Date().toISOString(),
            title: title,
            post: content,
            creator: {
                name: 'Alejandro',
            },
            createdAt: new Date()
        }
    });
}