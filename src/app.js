import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app =express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"})) //taking data from url
app.use(express.static("public")) //configuration for asset

app.use(cookieParser())


export {app}