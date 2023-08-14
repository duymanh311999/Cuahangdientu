const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var blogSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    categroy:{
        type:String,
        required:true,
    },
    numberView:{
        type:Number,
        default: 0
    },
    likes: [
        {type: mongoose.Types.ObjectId, ref: 'User',}
    ],
    dislikes: [
        {type: mongoose.Types.ObjectId, ref: 'User',}
    ],
    image: [
        {type: String, default: 'https://c.wallhere.com/photos/7e/e0/architecture_fans-50775.jpg!d',}
    ],
    author: [
        {type: String, default: 'Admin',}
    ],
    
}, {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

//Export the model
module.exports = mongoose.model('Blog', blogSchema);