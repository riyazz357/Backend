
import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    userName:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
        index:true
    },
     email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
     },
     Fullname:{
        type:String,
        required:true,
        trim:true,
        index:true,
     },
     avatar:{
        type:String, // cloudinary ka service use krbe url ke liye
        required:true
     },
     coverImage:{
        type:String,

     },
     watchHistory:[{
        type:Schema.Types.ObjectId,
        ref: "Video",
     }],
     password:{
        type:String,
        required:[true,"password is required"]
     },
     refreshToken:{
        type:String,
     }
},{timestamps:true});

userSchema.pre("save",async function(next){ //password encrypt function
    if(!this.isModified("password")) return next();

    this.password= await bcrypt.hash(this.password,10) // 10 is the salt round
    next();

});
userSchema.methods.isPasswordCorrect=async function(password) {
    return await bcrypt.compare(password,this.password) ;
}

userSchema.methods.generateAccessToken=function(){ //token generation
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            userName:this.userName,
            Fullname:this.Fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }

    )
}
userSchema.methods.generateRefreshToken=function(){ //token generation and it take less info 
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }

    )
}
userSchema.methods.generateRefreshToken=function(){}
export const User= mongoose.model("User",userSchema);