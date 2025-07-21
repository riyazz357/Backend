import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middlleware.js";
import { verifyJwt } from "../middleware/auth..middleware.js";
const router=Router()

router.route("/register").post(
    upload.fields([   //injecting middleware
        {
        name:"avatar",
        maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)

    router.route("/login").post(loginUser)
    //secured route
    router.route("/logout").post(verifyJwt,logoutUser)
export default router;