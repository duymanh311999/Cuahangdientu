const Product = require('../models/product');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify')

const createProduct = asyncHandler(async (req, res) => { 
    const {title, description, brand, price, category, color} = req.body
    const thumb = req?.files?.thumb[0]?.path
    const images = req.files?.images?.map(el => el.path)
    if(!(title && description && brand && price && category && color )){
        throw new Error('Missing parameter')
    }
    req.body.slug = slugify(title) 
    if(thumb){
        req.body.thumb = thumb
    }
    if(images){
        req.body.images = images
    }
    const newProduct = await Product.create(req.body);
    return res.status(200).json({
        success: newProduct ? true : false,
        createProduct: newProduct ? newProduct : 'Can not creat new product'
    })
})

const getProduct = asyncHandler(async (req, res) => {   
   const {pid} = req.params;
   const product = await Product.findById(pid).populate({
    path: 'ratings',
    populate: {
        path: 'postedBy',
        select: 'firstname lastname avatar'
    }
   });
    return res.status(200).json({
        success: product ? true : false,
        productDatas: product ? product : 'Can not get product'
    })
})


const getProducts = asyncHandler(async (req, res) => { 
    const queries = {...req.query};
    // Tách các trường đặc biệt ra khỏi query
    const excludeFields = ['limit', 'sort', 'page', 'fields']
    excludeFields.forEach(el => delete queries[el])

    // Format lại các operators cho đúng cứ pháp mongoose
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchdEl => `$${matchdEl}` )
    const formatedQueries = JSON.parse(queryString);
    let colorQueryObject = {}
    //Filtering
    if(queries?.title){
        formatedQueries.title = {
            $regex: queries.title,
            $options: 'i'
        }
    }
    if(queries?.category){
        formatedQueries.category = {
            $regex: queries.category,
            $options: 'i'
        }
    }
    if(queries?.color){
        delete formatedQueries.color
        const colorArr = queries.color?.split(',')
        const colorQuery = colorArr.map(el => ({ color: {$regex: el, $options: 'i'}}))
        colorQueryObject = {$or: colorQuery}
    }
    const q = {...colorQueryObject, ...formatedQueries}
    let queryCommand = Product.find(q)

    // Sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        queryCommand = queryCommand.sort(sortBy)
    }

    // Fields limiting
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        queryCommand = queryCommand.select(fields)
    }

    // Pagination 
    const page = +req.query.page || 1;
    const limit = +req.query.limit || process.env.LIMIT_PRODUCTS;
    const skip = (page -1) * limit;
    queryCommand.skip(skip).limit(limit)

    queryCommand.exec(async(err, response) => {
        if(err){
            throw new Error(err.message)
        }
        const counts = await Product.find(q).countDocuments();
        return res.status(200).json({
            success: response ? true : false,
            products: response ? response : 'Can not get products',
            counts
        })
    })
})

const updateProduct = asyncHandler(async (req, res) => { 
    const {pid} = req.params;
    if(req.body && req.body.title){
        req.body.slug = slugify(req.body.title) 
    }
    const updateProduct = await Product.findByIdAndUpdate(pid, req.body, {new: true});
    return res.status(200).json({
         success: updateProduct ? true : false,
         updateProduct: updateProduct ? updateProduct : 'Can not update products'
     })
})


const deleteProduct = asyncHandler(async (req, res) => { 
    const {pid} = req.params;
    const deleteProduct = await Product.findByIdAndDelete(pid);
    return res.status(200).json({
         success: deleteProduct ? true : false,
         deleteProduct: deleteProduct ? deleteProduct : 'Can not delete products'
     })
})

const ratings = asyncHandler(async (req, res) => { 
    const {_id} = req.user;
    const {star, comment, pid, updatedAt} = req.body;
    if(!star || !pid){
        throw new Error('Missing parameter')
    }
    const ratingProduct = await Product.findById(pid);
    const alreadyRating = ratingProduct?.ratings?.find(el => el.postedBy.toString() === _id);
    if(alreadyRating){
        await Product.updateOne({
            ratings: {$elemMatch: alreadyRating}
        }, {
            $set: { "ratings.$.star": star, "ratings.$.comment": comment,  "ratings.$.updatedAt": updatedAt }
        }, {new: true})
    }else{
        await Product.findByIdAndUpdate(pid, {
            $push: {ratings: {star, comment, postedBy: _id, updatedAt}}
        }, {new: true})
    }

    // sum ratings 
    const updatedProduct = await Product.findById(pid);
    const ratingCount = updatedProduct.ratings.length;
    const sumRatings = updatedProduct.ratings.reduce((sum, el) => sum + +el.star, 0);
    updatedProduct.totalRatings = Math.round(sumRatings *10/ratingCount) / 10

    await updatedProduct.save()

    return res.status(200).json({
        status: true,
        updatedProduct
    })
 }) 

const uploadImagesProduct = asyncHandler(async (req, res) => { 
    const {pid} = req.params;
    if(!req.files){
        throw new Error('Missing parameter')
    }
    const response = await Product.findByIdAndUpdate(pid, {$push: {images: {$each: req.files.map(el => el.path)}}}, {new: true})
    return res.status(200).json({
        status: response ? true : false,
        uploadImagesProduct: response ? response : 'Cant upload images product',
    })
})



module.exports = {
    createProduct,
    getProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    ratings,
    uploadImagesProduct,
}