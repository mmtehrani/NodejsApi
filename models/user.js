const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const userSchema = mongoose.Schema({
    first_name : { type : String , required : true },
    last_name : { type : String , required : true },
    user_name : { type : String , required : true },
    email_address : { type : String ,required : true},
    // email_address : { type : String , unique : true  ,required : true},
    password : { type : String ,  required : true },
    avatar : { type : String ,  required : false },
    content_type : { type : String ,  required : false },
    file_type : { type : String ,  required : false },
} , { timestamps : true });

userSchema.plugin(mongoosePaginate);

userSchema.statics.hashPassword = function(password) {
    let salt = bcrypt.genSaltSync(15);
    let hash = bcrypt.hashSync(password , salt);
    return hash;
}


module.exports = mongoose.model('User' , userSchema);