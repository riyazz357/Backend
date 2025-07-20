// require('dotenv').config({path: './env'})

import dotenv from "dotenv"
dotenv.config({
    path: "./env",
})
import express from "express";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import {app} from "./app.js";


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running on port: ${process.env.PORT || 8000}`)
    });
})
.catch((err)=>{
    console.log("mongo db connection faileds")
})





/*
import express from "express"
const app=express()

(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Error:",error);
            throw error
        })
        app.listen(process.env.PORT,() =>{
            console.log(`App is listening on the port ${process.env.PORT}`);
        })
    } catch(error){
        console.error("Error:",error)
        throw err
    }
})()
    */