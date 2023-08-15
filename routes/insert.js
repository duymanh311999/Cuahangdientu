const router = require('express').Router();
const controllers = require('../controllers/insertData');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken');


router.post('/', controllers.insertProduct);
router.post('/cate', controllers.insertCategory);


module.exports = router