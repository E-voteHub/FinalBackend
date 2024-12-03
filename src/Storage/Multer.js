import multer from "multer"
import path from "path"
import { fileURLToPath } from 'url'; 
import { dirname } from 'path'; 

const __filename = fileURLToPath(import.meta.url); 
const __dirname = dirname(__filename)


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `${__dirname}/../public/images`)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
  })
  
const upload = multer({ storage: storage })

export default upload