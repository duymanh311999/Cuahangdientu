const Brand = require('../models/brand');
const asyncHandler = require('express-async-handler');

const createNewBrand = asyncHandler(async (req, res) => { 
    const response = await Brand.create(req.body);
    return res.json({
        success: response ? true : false,
        createBrand: response ? response : 'Can not creat new Brand'
    })
})

const getBrands = asyncHandler(async (req, res) => { 
    const response = await Brand.find();
    return res.json({
        success: response ? true : false,
        Brand: response ? response : 'Can not get Brand'
    })
})

const updateBrand = asyncHandler(async (req, res) => { 
    const {bid} = req.params;
    const response = await Brand.findByIdAndUpdate(bid, req.body, {new: true});
    return res.json({
        success: response ? true : false,
        updatedBrand: response ? response : 'Can not update Brand'
    })
})

const deleteBrand = asyncHandler(async (req, res) => { 
    const {bid} = req.params;
    const response = await Brand.findByIdAndDelete(bid);
    return res.json({
        success: response ? true : false,
        deletedBrand: response ? response : 'Can not delete Brand'
    })
})

module.exports = {
    createNewBrand,
    getBrands,
    updateBrand,
    deleteBrand
}