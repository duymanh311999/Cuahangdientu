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
    const {bid} = req.body;
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

module.exports ={
    createNewBlog,
    updateBlog,
    getBlog,
    likeBlog
}