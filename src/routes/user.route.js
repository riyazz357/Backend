import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middlleware.js";
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

export default router;