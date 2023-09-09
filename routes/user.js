const router = require('express').Router();
const controllers = require('../controllers/user');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken');
const uploader = require('../config/cloudinary.config');

router.post('/register', controllers.register);
router.put('/finalregister/:token', controllers.finalRegister);
router.post('/login', controllers.login);
router.get('/current',verifyAccessToken, controllers.getCurrent);
router.post('/refershtoken', controllers.refreshaccessToken);
router.get('/logout', controllers.logout);
router.post('/forgotpassword', controllers.forgotPassword);
router.put('/resetpassword', controllers.resetPassword);
router.get('/',[verifyAccessToken, isAdmin], controllers.getUsers);
router.delete('/:uid',[verifyAccessToken, isAdmin], controllers.deleteUsers);
router.put('/current',verifyAccessToken, uploader.single('avatar') ,controllers.updateUsers);
router.put('/address',verifyAccessToken, controllers.updateUserAddress);
router.put('/cart',verifyAccessToken, controllers.updateCart);
router.delete('/remove-cart/:pid/:color',verifyAccessToken, controllers.removeProductInCart);
router.put('/:uid',[verifyAccessToken, isAdmin], controllers.updateUserByadmin);


module.exports = router


  