const User = require('../models/user');
const asyncHandler = require('express-async-handler');
const { generateAccessToken, generateRefreshToken } = require('../middlewares/jwt');
const jwt = require('jsonwebtoken');


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
    if(response && await response.isCorrectPasswords(password)){
        // Tach password va role ra khoi reresponse
        const {password, role, ...userData} = response.toObject();
        //Tao access token
        const accessToken = generateAccessToken(response._id, role);
        //Tao refresh token
        const refreshToken = generateRefreshToken(response._id);
        // Luu refresh token vao database 
        await User.findByIdAndUpdate(response._id, {refreshToken}, {new: true});
        // Luu refresh tokeb vao cookie
        res.cookie('refreshToken', refreshToken, {httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000})
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
        success: false,
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

module.exports = {
    register, 
    login,
    getCurrent,
    refreshaccessToken,
    logout,
}