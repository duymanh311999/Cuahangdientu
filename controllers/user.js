const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const sendMail = require('../ultils/sendMail');
const { generateAccessToken, generateRefreshToken } = require('../middlewares/jwt');

const register = asyncHandler(async (req, res) => {
    const { email, password, firstname, lastname } = req.body
    if (!email || !password || !lastname || !firstname){
        return res.status(400).json({
            success: false,
            message: 'Missing parameter'
        })}

    const user = await User.findOne({email})
    if(user) {
        throw new Error('User has existed!')
    } else {
        const newUser = await User.create(req.body)
        return res.status(200).json({
            success: newUser ? true : false,
            message: newUser ? 'Register is successfully, please login to continue' : 'Something went wrong'
         })
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
            sucess: true,
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
    const {email} = req.query
    if (!email){
        throw new Error('Missing email')
    }
    const user = await User.findOne({email})
    if (!user) {
        throw new Error('User not found')
    }
    const resetToken = user.createPasswordChangedToken()
    await user.save()

    const html = `xin vui lòng nhấn vào link dưới đây để thay đổi mật khẩu của bạn. Link này sẽ hết hạn sau 15 phút. 
    <a href= ${process.env.URL_SERVER}/api/user/reset-password/${resetToken}>Click</a>`

    const data = {
        email, 
        html
    }
    const rs = await sendMail(data)
    return res.status(200).json({
        success: true,
        rs
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
    const response = await User.findByIdAndUpdate(uid, req.body, {new: true}).select('-password -role')
    return res.status(200).json({
        success: response ? true : false,
        updatedUser: response ? response : 'Somthing went wrong!'
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
    updateUserByadmin
}