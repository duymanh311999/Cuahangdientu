const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const makeToken = require('uniqid'); 

const User = require('../models/user');
const sendMail = require('../ultils/sendMail');
const { generateAccessToken, generateRefreshToken } = require('../middlewares/jwt');
const { btoa, atob } = require('buffer');
const { response } = require('express');


const register = asyncHandler(async (req, res) => {
    const { email, password, firstname, lastname, mobile } = req.body
    if (!email || !password || !lastname || !firstname || !mobile){
        return res.status(400).json({
            success: false,
            message: 'Vui lòng điền đầy đủ thông tin'
        })}
        const user = await User.findOne({email})
            if(user) {
                throw new Error('Người dùng đã tồn tại!')
            } else {
                const token = makeToken()
                const emailEdited = btoa(email) + '@' + token
                const newUser = await User.create({
                    email: emailEdited, password, firstname, lastname, mobile
                })
                if(newUser){
                    const html = `<h2>Mã đăng ký:</h2><br/><blockquote>${token}</blockquote>`
                    await sendMail({email, html, subject: 'Hoàn tất đăng ký Digital World 2'})
                }
                setTimeout(async() => {
                    await User.deleteOne({email: emailEdited})
                },[300000])
                return res.json({
                    success: newUser ? true : false,
                    message: newUser ? 'Vui lòng kiểm tra Email để kích hoạt tài khoản' : 'Có lỗi xảy ra, vui lòng thử lại sau'
                })
            }
})

const finalRegister = asyncHandler(async (req, res) => { 
    // const cookie  = req.cookies;  
    const {token} = req.params;
    const notActivedEmail = await User.findOne({email: new RegExp(`${token}$`)})
    if(notActivedEmail){
        notActivedEmail.email = atob(notActivedEmail?.email?.split('@')[0])
        notActivedEmail.save()
    }
    return res.json({
        success: notActivedEmail ? true : false,
        message: notActivedEmail ? 'Đăng ký thành công, vui lòng đăng nhập để tiếp tục' : 'Có lỗi xảy ra, vui lòng thử lại sau',
    })
})

const login = asyncHandler(async (req, res) => {
    const { email, password} = req.body
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Missing parameter'
        })}
    
    const response = await User.findOne({email})
    if (response && await response.isCorrectPassword(password)) {
        // Tách password và role ra khỏi response
        const { password, role, refreshToken, ...userData } = response.toObject()
        // Tạo access token
        const accessToken = generateAccessToken(response._id, role)
        // Tạo refresh token
        const newRefreshToken = generateRefreshToken(response._id)
        // Lưu refresh token vào database
        await User.findByIdAndUpdate(response._id, { refreshToken: newRefreshToken }, { new: true })
        // Lưu refresh token vào cookie
        res.cookie('refreshToken', newRefreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 })
        return res.status(200).json({
            success: true,
            accessToken,
            userData
        })
    } else {
        throw new Error('Invalid credentials!')
    }
})

const getCurrent = asyncHandler(async (req, res) => {
    const { _id} = req.user
    const user = await User.findById(_id).select('-refreshToken -password').populate({
        path: 'cart',
        populate: {
            path: 'product',
            select: 'title thumb price'
        }   
    })
    return res.status(200).json({
        success: user ? true : false,
        rs: user ? user : 'user not found'
    })
})

const refreshaccessToken = asyncHandler(async (req, res) => {
    // Lấy token từ cookies
    const cookie = req.cookies;
    // Check xem có token hay ko
    if(!cookie && !cookie.refreshToken) {
        throw new Error('No refreshToken in cookies')
    }
    // Check token có hợp lệ ko

        // Check xem token có khớp vs token đã lưu trong db ko
        const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET)    
        const response = await User.findOne({_id: rs._id, refreshToken: cookie.refreshToken})
            return res.status(200).json({
                success: response ? true : false,
                newAccessToken: response ? generateAccessToken(response._id, response.role) : 'Refresh token is not matched'
            })
})

const logout = asyncHandler(async (req, res) => { 
    const cookie = req.cookies;
    if (!cookie || !cookie.refreshToken) {
        throw new Error('No refresh token in cookies')
    }
    // Xoa refersh tkoen o db
    await User.findOneAndUpdate({refreshToken: cookie.refreshToken}, {refreshToken: ''}, {new: true})
    // Xoa refersh tkoen o trinh duyet
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true
    })
    return res.status(200).json({
        success: true,
        message: 'Logout is done'
    })
})

const forgotPassword = asyncHandler(async (req, res) => {
    const {email} = req.body  
    if (!email){
        throw new Error('Missing email')
    }
    const user = await User.findOne({email})
    if (!user) {
        throw new Error('User not found')
    }
    const resetToken = user.createPasswordChangedToken()
    await user.save()

    const html = `Xin vui lòng nhấn vào link dưới đây để thay đổi mật khẩu của bạn. Link này sẽ hết hạn sau 15 phút. 
    <a href= ${process.env.CLIENT_URL}/reset-password/${resetToken}>Click here</a>`

    const data = {
        email, 
        html,
        subject: 'Quên mật khẩu'
    }
    const rs = await sendMail(data)
    return res.status(200).json({
        success: rs.response?.includes('OK') ? true : false,
        message: rs.response?.includes('OK') ? 'Vui lòng kiểm tra Mail của bạn' : 'Có lỗi xảy ra, vui lòng thử lại sau'
    })
 })

 const resetPassword = asyncHandler(async (req, res) => { 
    const { password, token } = req.body;
    if (!password || !token) {
        throw new Error('Missing imputs')
    }
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({passwordResetToken, passwordResetExpires: {$gt: Date.now()}});
    if (!user) {
        throw new Error('Invalid reset token')
    }
    user.password = password
    user.passwordResetToken=undefined
    user.passwordChangedAt=Date.now()
    user.passwordResetExpires=undefined
    await user.save()
    return res.status(200).json({
        success: user ? true : false,
        message: user ? 'Updated password' : 'Something went wrong'
    })
 })


const getUsers = asyncHandler(async (req, res) => { 
    const queries = {...req.query};
    // Tách các trường đặc biệt ra khỏi query
    const excludeFields = ['limit', 'sort', 'page', 'fields']
    excludeFields.forEach(el => delete queries[el])

    // Format lại các operators cho đúng cứ pháp mongoose
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchdEl => `$${matchdEl}` )
    const formatedQueries = JSON.parse(queryString);
    //Filtering
    if(queries?.name){
        formatedQueries.name = {
            $regex: queries.name,
            $options: 'i'
        }
    }

    if (req.query.q) {
       delete formatedQueries.q
       formatedQueries['$or'] = [
        // $options: 'i' để ko phân biệt viết hoa hay viết thường
        {firstname: { $regex: req.query.q, $options: 'i'}},
        {lastname: { $regex: req.query.q, $options: 'i'}},
        {email: { $regex: req.query.q, $options: 'i'}},
       ]
    }

    let queryCommand = User.find(formatedQueries)

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
        const counts = await User.find(formatedQueries).countDocuments();
        return res.status(200).json({
            success: response ? true : false,
            users: response ? response : 'Can not get products',
            counts
        })
    })
})

const deleteUsers = asyncHandler(async (req, res) => { 
    const {uid} = req.params;
    const response = await User.findByIdAndDelete(uid)
    return res.status(200).json({
        success: response ? true : false,
        message: response ? `Người dùng ${response.email} đã bị xóa` : 'Có lỗi xảy ra'
    })
})

const updateUsers = asyncHandler(async (req, res) => { 
    const {_id} = req.user;
    const {firstname, lastname, email, mobile} = req.body;
    const data = {firstname, lastname, email, mobile}
    if(req.file) data.avatar = req.file.path; 
    if(!_id || Object.keys(req.body).length === 0){
        throw new Error('Missing parameter')
    }
    const response = await User.findByIdAndUpdate(_id, data, {new: true}).select('-password -role')
    return res.status(200).json({
        success: response ? true : false,
        message: response ? 'Cập nhật thành công' : 'Có lỗi xảy ra'
    })
})

const updateUserByadmin = asyncHandler(async (req, res) => { 
    const {uid} = req.params;
    if(Object.keys(req.body).length === 0){
        throw new Error('Missing parameter')
    }
    const response = await User.findByIdAndUpdate(uid, req.body, {new: true}).select('-password -role -refreshToken')
    return res.status(200).json({
        success: response ? true : false,
        message: response ? 'Cập nhật thành công' : 'Có lỗi xảy ra'
    })
})
 
const updateUserAddress = asyncHandler(async (req, res) => { 
    const {_id} = req.user;
    if(!req.body.address){
        throw new Error('Missing parameter')
    }
    const response = await User.findByIdAndUpdate(_id,{$push: {address: req.body.address}}, {new: true}).select('-password -role -refreshToken')
    return res.status(200).json({
        success: response ? true : false,
        updatedAddress: response ? response : 'Somthing went wrong!'
    })
})

const updateCart = asyncHandler(async (req, res) => { 
    const {_id} = req.user;
    const {pid, quantity = 1, color, price, thumbnail, title} = req.body;
    if(!pid || !color){
        throw new Error('Missing parameter')
    }
    const user = await User.findById(_id).select('cart');
    const alreadyProduct = user?.cart?.find(el => el.product.toString() === pid);
    if(alreadyProduct && alreadyProduct.color === color){
            const response = await User.updateOne({cart: {$elemMatch: alreadyProduct}}, {$set: {
                "cart.$.quantity": quantity, 
                "cart.$.price": price, 
                "cart.$.thumbnail": thumbnail,
                "cart.$.title": title,
            }}, {new: true});
            return res.status(200).json({
                success: response ? true : false,
                message: response ? 'Thêm vào giỏ hàng thành công' : 'Có lỗi xảy ra!'
            })
    }else{
        const response = await User.findByIdAndUpdate(_id, {$push: {cart: {product: pid, quantity, color, price, thumbnail, title}}}, {new: true});
        return res.status(200).json({
            success: response ? true : false,
            message: response ? 'Thêm vào giỏ hàng thành công' : 'Có lỗi xảy ra!'
        })
    }
})

const removeProductInCart = asyncHandler(async (req, res) => { 
    const {_id} = req.user;
    const {pid, color} = req.params;
    const user = await User.findById(_id).select('cart');
    const alreadyProduct = user?.cart?.find(el => el.product.toString() === pid && el.color === color);
    if(!alreadyProduct) return res.status(200).json({
        success: true,
        users: response ? response : 'Có lỗi xảy ra!'
    })
    const response = await User.findByIdAndUpdate(_id, {$pull: {cart: {product: pid, color}}}, {new: true});
    return res.status(200).json({
        success: response ? true : false,
        message: response ? 'Xoá thành công' : 'Có lỗi xảy ra!'
    }) 
})

module.exports = {
    register, 
    login,
    getCurrent,
    refreshaccessToken,
    logout,
    forgotPassword,
    resetPassword,
    getUsers,
    deleteUsers,
    updateUsers,
    updateUserByadmin,
    updateUserAddress,
    updateCart,
    finalRegister,
    removeProductInCart
}