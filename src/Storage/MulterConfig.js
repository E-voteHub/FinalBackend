import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to a file path 
const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); // Example usage with multer 
const storage = multer.diskStorage({ destination: (req, file, cb) => { const uploadPath = path.join(__dirname, 'public','images'); 
    cb(null, uploadPath); }, filename: (req, file, cb) => { 
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); 

    } }); 
    
    const upload = multer({ storage: storage });

export default upload