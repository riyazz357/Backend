import multer from "multer";


const storage = multer.diskStorage({
  destination: function (req, file, cb) { //cd : callback
    cb(null, "./public/temp") //destination where to store file
  },
  filename: function (req, file, cb) {
   // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname)//fieldname + '-' + uniqueSuffix)
  }
})


export const upload = multer({ 
    storage,
})