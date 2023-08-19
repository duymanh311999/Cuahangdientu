const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const makeToken = require('uniqid'); 

const User = require('../models/user');
const sendMail = require('../ultils/sendMail');
const { generateAccessToken, generateRefreshToken } = require('../middlewares/jwt');


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
                res.cookie('dataregister', {...req.body, token}, {httpOnly: true, maxAge: 15 * 60* 1000} )
                const html = `Xin vui lòng nhấn vào link dưới đây để hoàn tất quá trình đăng ký. Link này sẽ hết hạn sau 15 phút. 
                <a href= ${process.env.URL_SERVER}/api/user/finalregister/${token}>Click here</a>`
                await sendMail({email, html, subject: 'Hoàn tất đăng ký Digital World 2'})
                return res.json({
                    success: true,
                    message: 'Vui lòng kiểm tra Email để kích hoạt tài khoản'
                })
            }
})

const finalRegister = asyncHandler(async (req, res) => { 
    const cookie  = req.cookies;
    const {token} = req.params;
    if(!cookie || cookie?.dataregister?.token !== token){
        res.clearCookie('dataregister')
        return res.redirect(`${process.env.CLIENT_URL}/finalregister/failed`)
    }
    const newUser = await User.create({
        email: cookie?.dataregister?.email,
        password: cookie?.dataregister?.password,
        mobile: cookie?.dataregister?.mobile,
        firstname: cookie?.dataregister?.firstname,
        lastname: cookie?.dataregister?.lastname,
    })
    res.clearCookie('dataregister')
    if(newUser){
        return res.redirect(`${process.env.CLIENT_URL}/finalregister/success`)
    }else{
        return res.redirect(`${process.env.CLIENT_URL}/finalregister/failed`)
    }
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
    const user = await User.findById(_id).select('-refreshToken -password -role')
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
    const response = await User.find().select('-refreshToken -password -role')
    return res.status(200).json({
        success: response ? true : false,
        users: response
    })
})

const deleteUsers = asyncHandler(async (req, res) => { 
    const {_id} = req.query;
    if(!_id){
        throw new Error('Missing parameter')
    }
    const response = await User.findByIdAndDelete(_id)
    return res.status(200).json({
        success: response ? true : false,
        deletedUser: response ? `User with enail ${response.email} has been deleted` : 'No user delete'
    })
})

const updateUsers = asyncHandler(async (req, res) => { 
    const {_id} = req.user;
    if(!_id || Object.keys(req.body).length === 0){
        throw new Error('Missing parameter')
    }
    const response = await User.findByIdAndUpdate(_id, req.body, {new: true}).select('-password -role')
    return res.status(200).json({
        success: response ? true : false,
        updatedUser: response ? response : 'Somthing went wrong!'
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
        updatedUser: response ? response : 'Somthing went wrong!'
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
    const {pid, quantity, color} = req.body;
    if(!pid || !quantity || !color){
        throw new Error('Missing parameter')
    }
    const user = await User.findById(_id).select('cart');
    const alreadyProduct = user?.cart?.find(el => el.product.toString() === pid);
    if(alreadyProduct){
        if(alreadyProduct.color === color){
            const response = await User.updateOne({cart: {$elemMatch: alreadyProduct}}, {$set: {"cart.$.quantity": quantity}}, {new: true});
            return res.status(200).json({
                success: response ? true : false,
                updatedCart: response ? response : 'Somthing went wrong!'
            })
        }else{
            const response = await User.findByIdAndUpdate(_id, {$push: {cart: {product: pid, quantity, color}}}, {new: true});
            return res.status(200).json({
                success: response ? true : false,
                updatedCart: response ? response : 'Somthing went wrong!'
            })
        }
    }else{
        const response = await User.findByIdAndUpdate(_id, {$push: {cart: {product: pid, quantity, color}}}, {new: true});
        return res.status(200).json({
            success: response ? true : false,
            updatedCart: response ? response : 'Somthing went wrong!'
        })
    }
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
    finalRegister
}