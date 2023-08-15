const Blog = require('../models/blog');
const asyncHandler = require('express-async-handler');

const createNewBlog = asyncHandler(async (req, res) => { 
    const {title, description, categroy} = req.body;
    if(!title || !description || !categroy){
        throw new Error('Missing parameter')
    }
    const response = await Blog.create(req.body);
    return res.json({
        success: response ? true : false,
        createBlog: response ? response : 'Can not creat new blog'
    })
})

const updateBlog = asyncHandler(async (req, res) => { 
    const {bid} = req.params;
    if(Object.keys(req.body).length === 0){
        throw new Error('Missing parameter')
    }
    const response = await Blog.findByIdAndUpdate(bid, req.body, {new: true});
    return res.json({
        success: response ? true : false,
        updateBlog: response ? response : 'Can not update blog'
    })
})

const getBlog = asyncHandler(async (req, res) => { 
    const response = await Blog.find();
    return res.json({
        success: response ? true : false,
        updateBlog: response ? response : 'Can not get blog'
    })
})

const likeBlog = asyncHandler(async (req, res) => { 
    const {_id} = req.user;
    const {bid} = req.params;
    if(!bid){
        throw new Error('Missing parameter')
    }
    const blog = await Blog.findById(bid);
    const alreadyDislike = blog?.dislikes?.find(el => el.toString() === _id);
    if(alreadyDislike){
        const response = await Blog.findByIdAndUpdate(bid, {$pull: {dislikes: _id}}, {new: true});
        return res.json({
            success: response ? true : false,
            rs: response
        })
    }
    const isLiked = blog?.likes?.find(el => el.toString() === _id);
    if(isLiked){
        const response = await Blog.findByIdAndUpdate(bid, {$pull: {likes: _id}}, {new: true});
        return res.json({
            success: response ? true : false,
            rs: response
        })
    }else{
        const response = await Blog.findByIdAndUpdate(bid, {$push: {likes: _id}}, {new: true});
        return res.json({
            success: response ? true : false,
            rs: response
        })
    }
})

const dislikeBlog = asyncHandler(async (req, res) => { 
    const {_id} = req.user;
    const {bid} = req.params;
    if(!bid){
        throw new Error('Missing parameter')
    }
    const blog = await Blog.findById(bid);
    const alreadylike = blog?.likes?.find(el => el.toString() === _id);
    if(alreadylike){
        const response = await Blog.findByIdAndUpdate(bid, {$pull: {likes: _id} }, {new: true});
        return res.json({
            success: response ? true : false,
            rs: response
        })
    }
    const isDisliked = blog?.dislikes?.find(el => el.toString() === _id);
    if(isDisliked){
        const response = await Blog.findByIdAndUpdate(bid, {$pull: {dislikes: _id}}, {new: true});
        return res.json({
            success: response ? true : false,
            rs: response
        })
    }else{
        const response = await Blog.findByIdAndUpdate(bid, {$push: {dislikes: _id}}, {new: true});
        return res.json({
            success: response ? true : false,
            rs: response
        })
    }
})

const getBlogs = asyncHandler(async (req, res) => { 
    const {bid} = req.params;
    const blog = await Blog.findByIdAndUpdate(bid, {$inc: {numberView: 1}} , {new: true})
        .populate('likes', 'firstname lastname')
        .populate('dislikes', 'firstname lastname');
    return res.json({
        success: blog ? true : false,
        rs: blog
    })
})


const deleteBlogs = asyncHandler(async (req, res) => { 
    const {bid} = req.params;
    const blog = await Blog.findByIdAndDelete(bid)
    return res.json({
        success: blog ? true : false,
        deletedBlog: blog || 'Something went wrong'
    })
})

const uploadImagesBlog = asyncHandler(async (req, res) => { 
    const {bid} = req.params;
    if(!req.file){
        throw new Error('Missing parameter')
    }
    const response = await Blog.findByIdAndUpdate(bid, {image: req.file.path}, {new: true})
    return res.status(200).json({
        status: response ? true : false,
        uploadImagesBlog: response ? response : 'Cant upload images blog',
    })
})

module.exports ={
    createNewBlog,
    updateBlog,
    getBlog,
    likeBlog,
    dislikeBlog,
    getBlogs,
    deleteBlogs,
    uploadImagesBlog
}