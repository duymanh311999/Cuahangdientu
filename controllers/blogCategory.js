const BlogCategory = require('../models/blogCategory');
const asyncHandler = require('express-async-handler');

const createCategory = asyncHandler(async (req, res) => { 
    const response = await BlogCategory.create(req.body);
    return res.json({
        success: response ? true : false,
        createCategory: response ? response : 'Can not creat new blog Category'
    })
})

const getCategories = asyncHandler(async (req, res) => { 
    const response = await BlogCategory.find().select('title _id');
    return res.json({
        success: response ? true : false,
        BlogCategory: response ? response : 'Can not get blog Category'
    })
})

const updateCategory = asyncHandler(async (req, res) => { 
    const {bcid} = req.params;
    const response = await BlogCategory.findByIdAndUpdate(bcid, req.body, {new: true});
    return res.json({
        success: response ? true : false,
        updateCategory: response ? response : 'Can not update blog Category'
    })
})

const deleteCategory = asyncHandler(async (req, res) => { 
    const {bcid} = req.params;
    const response = await BlogCategory.findByIdAndDelete(bcid);
    return res.json({
        success: response ? true : false,
        deletedCategory: response ? response : 'Can not delete blog Category'
    })
})

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
}