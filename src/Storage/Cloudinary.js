import { v2 as cloudinary } from 'cloudinary';

const cloudinaryConfig = ()=> {
  cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_API, 
        api_secret: process.env.CLOUDINARY_SECRET // Click 'View API Keys' above to copy your API secret
    });
}

export default cloudinaryConfig

