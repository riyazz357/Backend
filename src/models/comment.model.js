import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Video } from "./video.model";

const commentShema=new Schema(
    {
        content:{
            type:String,
            require:true
        },
        Video:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
        }


},{timestamps:true})

commentShema.plugin(mongooseAggregatePaginate)

export const Comment=mongoose.Schema.model("comment",commentShema)