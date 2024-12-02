import express, { response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import LocalStrategy from 'passport-local';
import session from 'express-session';
import cors from 'cors'
import RegisteredUser from './src/models/RegisteredUser.js';
import Candidate from './src/models/CandidateSchema.js';
import { v4 as uuidv4 } from 'uuid';
import { GridFSBucket } from 'mongodb'; //for image bucket
// import cloudinary from './src/Storage/CloudinaryConfig.js';
// import Upload from './src/Storage/MulterConfig.js';

import multer from 'multer';


dotenv.config()



const app = express();
const PORT = process.env.PORT || 3000

// Configure Multer for file uploads 
const storage = multer.memoryStorage(); 
const upload = multer({ storage });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ 
origin: 'http://localhost:5173', // The origin you want to allow 
credentials: true 
})
);

//mongo ki details hai sensitive
const mongoUsername = process.env.MONGO_USERNAME; 
const mongoPassword = process.env.MONGO_PASSWORD; 
const mongoCluster = process.env.MONGO_CLUSTER;
let bucket ;
//mongooose atlas connnection
await mongoose.connect(`mongodb+srv://${mongoUsername}:${mongoPassword}@${mongoCluster}/?retryWrites=true&w=majority&appName=Cluster0`)
    .then((connection) => {
        console.log("DataBase Connected");
         // Create a GridFSBucket instance for file storage
         bucket = new GridFSBucket(connection.connection.db, {
            bucketName: 'images',
        });

        // You can now use `bucket` for file uploads and downloads
        console.log("GridFSBucket instance created successfully");
    })
    .catch((e) => {
        console.error("Error :", e);
    });

    
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, unique: true, required: true },
    Email: {
        type: String,
        required : true,
        unique: true,
        trim: true,
        lowercase: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});



// Apply the plugin before creating the model
UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

app.use(session({ secret: 'yourSecretKey', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

// Use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.post('/register', (req, res) => {
    console.log("API DATA = ", req.body);

    const username = req.body.username;
    const Email = req.body.email;
    const password = req.body.password;

    if (!username || !password || !Email) {
        return res.status(400).send("Username, Email and password are required");
    }

    User.findOne({ username: username })
        .then((user) => {
            if (user) {
                return res.status(400).send("User already exists");
            }

            User.register(new User({ username ,Email }), password, (err, user) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Cannot register user");
                }
                passport.authenticate('local')(req, res, () => {
                    res.status(201).send(user);
                });
            });
        })
        .catch((err) => {
            console.log("Error checking user existence:", err);
            res.status(500).send("Error checking user existence");
        });
});

app.post('/login', passport.authenticate('local'), (req, res) => { // Instead of res.redirect, send a JSON response 
   req.session.user = req.user; 
   const email = req.body.email;
  // console.log(email," ",req.body)
   User.findOne({Email : email})
   .then((user)=>{
    console.log(user);
    res.json({ success: true, message: 'Login successful', username : user.username});
    
   }).catch((error)=>{
    console.log("Error in login route backend", error);
    
   })
   
});

//RegistertoVote

app.post("/registertovote", async (req, res) => {
  const { username, FullName, Age, DOB, PhoneNo, AadharNo, VoterID } = req.body;

  try {
    // Check for missing fields
    if (!username || !FullName || !Age || !DOB || !PhoneNo || !AadharNo || !VoterID) {
      return res.status(400).json({ message: "Please fill all the required details." });
    }

    // Validate the age
    if (Age < 18) {
      return res.status(400).json({
        message: `${FullName}, thanks for showing interest. Come back in ${18 - parseInt(Age)} years!`
      });
    }

    // Check if username already exists
    const existingUser = await RegisteredUser.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: `User ${username} is already registered.` });
    }

    // Check if Aadhar and Voter ID are already registered
    const existingAadhar = await RegisteredUser.findOne({ AadharNo });
    if (existingAadhar) {
      return res.status(409).json({ message: `Aadhar number ${AadharNo} is already registered.` });
    }

    const existingVoterID = await RegisteredUser.findOne({ VoterID });
    if (existingVoterID) {
      return res.status(409).json({ message: `Voter ID ${VoterID} is already registered.` });
    }

    // Create a new user with a unique key
    const uniqueKey = uuidv4();
    const newUser = new RegisteredUser({
      username,
      FullName,
      Age,
      DOB,
      PhoneNo,
      AadharNo,
      VoterID,
      uniqueKey,
      hasVoted: false
    });

    // Save the new user to the database
    await newUser.save();

    res.status(201).json({ message: `${FullName}, thanks for registering to vote!`, success: true });
  } catch (error) {
    console.error("Error during registration:", error);

    if (error.name === 'ValidationError') {
      // Handle validation errors
      return res.status(400).json({ message: "Please provide valid information for all fields." });
    }

    // Handle other unexpected errors
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
});

app.post('/candidate/register', upload.single('photo'), async (req, res) => {
  try {
    const { party, candidateName, voterID, gender } = req.body;
    const { originalname, buffer } = req.file;
    const isSelected = false
     console.log(originalname,buffer);
     

     
    const uploadStream = bucket.openUploadStream(originalname);
    uploadStream.write(buffer);
    uploadStream.end();

    uploadStream.on('finish', async () => {
      const newCandidate = new Candidate({ 
        party, 
        candidateName, 
        voterID, 
        gender, 
        photo: originalname ,// Store the filename in the candidate record
        isSelected
      });
      await newCandidate.save();
      res.status(200).json({ message: 'Candidate registered successfully!' });
    });

    uploadStream.on('error', (error) => {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'An error occurred while uploading the image!' });
    });

  } catch (error) {
    console.error('Error registering candidate:', error);
    res.status(500).json({ message: 'An error occurred while registering the candidate!' });
  }
});




app.get('/images', async (req, res) => {
  console.log('Request received for all images');

  try {
    // Query for image filenames in GridFS
    const images = await bucket.find({}).toArray();

    if (images.length === 0) {
      return res.status(404).send('No images found');
    }

    // Helper function to convert image to base64
    const convertToBase64 = (filename) => {
      return new Promise((resolve, reject) => {
        const chunks = [];
        const downloadStream = bucket.openDownloadStreamByName(filename);

        downloadStream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        downloadStream.on('error', (error) => {
          console.error('Error during image retrieval:', error);
          reject(error);
        });

        downloadStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString('base64');
          resolve(base64);
        });
      });
    };

    // Convert each image to base64 and collect results
    const imagePromises = images.map(image => convertToBase64(image.filename));
    const base64Images = await Promise.all(imagePromises);

    // Send base64 images and filenames as JSON
    const imageResponse = images.map((image, index) => ({
      filename: image.filename,
      data: base64Images[index]
    }));
   
    res.status(200).json(imageResponse);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).send('Internal Server Error');
  }


});


// sends candidate info to candidateGallery.jsx
app.get("/candidate", async (req, res) => {
  try {
    const response = await Candidate.find({isSelected : false});
    //console.log(response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).send('Internal Server Error');
  }
})
.put("/candidate", async (req,res)=>{
const {id} = req.body
try{
await Candidate.updateOne({_id : id},{isSelected: true})
 res.status(200).json({success:true})
}catch(error){
  console.error("Error Accepting user in PUT :: /candidate " , error)
}
})
.delete("/candidate", async (req,res)=>{
  const {id} = req.body
 // console.log(req.body);
  
Candidate.find({ _id: id })
    .then(documents => {
        console.log('Documents found:', documents);
        // If documents are found, you can attempt to delete them
        if (documents.length > 0) {
            Candidate.deleteOne({ _id : id })
                .then(result => {
                    console.log('Delete result:', result);
                })
                .catch(error => {
                    console.error('Error deleting candidate:', error);
                });
        } else {
            console.log('No matching documents found to delete.');
        }
    })
    .catch(error => {
        console.error('Error finding candidate:', error);
    });


})



// session route 
app.get('/session', (req, res) => { 
    if (req.session.user) { 
        res.send({ user: req.session.user }); 
    } else { 
        res.send({ message: 'No active session' });
    }
}); 

// Logout route

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.json("Logged out sucessfully")// Redirect to login page after logout
  });
});

app.listen(PORT, () => {
    console.log(`Server is running on port 3000 visit http://localhost:${PORT}`);
});
