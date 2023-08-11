const User = require('../models/user');
const asyncHandler = require('express-async-handler');
const { generateAccessToken, generateRefreshToken } = require('../middlewares/jwt') 


const register = asyncHandler(async (req, res) => {
    const { email, password, firstname, lastname } = req.body
    if (!email || !password || !lastname || !firstname){
        return res.status(400).json({
            sucess: false,
            message: 'Missing parameter'
        })}

    const user = await User.findOne({email})
    if(user) {
        throw new Error('User has existed!')
    } else {
        const newUser = await User.create(req.body)
        return res.status(200).json({
            sucess: newUser ? true : false,
            message: newUser ? 'Register is successfully, please login to continue' : 'Something went wrong'
         })
    }
})

const login = asyncHandler(async (req, res) => {
    const { email, password} = req.body
    if (!email || !password) {
        return res.status(400).json({
            sucess: false,
            message: 'Missing parameter'
        })}
    
    const response = await User.findOne({email})
    if(response && await response.isCorrectPasswords(password)){
        const {password, role, ...userData} = response.toObject();
        const accessToken = generateAccessToken(response._id, role);
        const refreshToken = generateRefreshToken(response._id)
        return res.status(200).json({
            sucess: true,
            accessToken,
            userData
        })
    } else {
        throw new Error('Invalid credentials!')
    }
})

module.exports = {
    register, 
    login,
}