const userRouter = require('./user');
const productRouter = require('./product');
const productCategoryRouter = require('./productCategory');
const blogCategoryRouter = require('./blogCategory');
const blogRouter = require('./blog');
const { notFound, errHandler } = require('../middlewares/errHandler');

const initRoutes = (app) => {
    app.use('/api/user', userRouter)
    app.use('/api/product', productRouter)
    app.use('/api/productcategory', productCategoryRouter)
    app.use('/api/blogcategory', blogCategoryRouter)
    app.use('/api/blog', blogRouter)


    
    app.use(notFound)
    app.use(errHandler)
}

module.exports = initRoutes