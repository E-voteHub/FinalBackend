import express from 'express';
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
import Admin from './src/models/AdminSchema.js'
import { v4 as uuidv4 } from 'uuid';
// import { GridFSBucket } from 'mongodb'; //for image bucket
import { v2 as cloudinary } from "cloudinary"
import { unlink } from "fs"
import cloudinaryConfig from "./src/Storage/Cloudinary.js"
import upload from './src/Storage/Multer.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import adminRegister from './src/Route/AdminRegister.js'
import adminLogin from './src/Route/AdminLogin.js'
// import multer from 'multer';


dotenv.config()

app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  credentials: true, // Allow credentials (cookies, etc.)
}));

// Explicitly Handle Preflight OPTIONS Requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200); // Return a successful response for preflight
});

const app = express();
const PORT = process.env.PORT || 3000

// Configure Multer for file uploads 
// const storage = multer.memoryStorage(); 
// const upload = multer({ storage });
//Gemini 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



//mongo ki details hai sensitive
const mongoUsername = process.env.MONGO_USERNAME; 
const mongoPassword = process.env.MONGO_PASSWORD; 
const mongoCluster = process.env.MONGO_CLUSTER;

//mongooose atlas connnection
await mongoose.connect(`mongodb+srv://${mongoUsername}:${mongoPassword}@${mongoCluster}/?retryWrites=true&w=majority&appName=Cluster0`)
    .then(() => {
        console.log("DataBase Connected");
    })
    .catch((e) => {
        console.error("Error :", e);
    });

    
const Schema = mongoose.Schema;

// Dont worry you can steal this schema but dont mess my project
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




UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

app.use(session({ 
  secret: process.env.SESSION_SECRET, 
  resave: false, 
  saveUninitialized: false, 
  cookie: { 
    secure: process.env.NODE_ENV === 'production',// Use secure cookies in production
    // httpOnly: true,
   } 
}));
app.use(passport.initialize());
app.use(passport.session());

//User ka authentication
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use('/api/admin/register', adminRegister); 
app.use('/api/admin/login', adminLogin);

app.post('/api/register', (req, res) => {
    

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

app.get("/",(req,res)=>{
  res.send("Hellow world")
})

app.post('/api/login', passport.authenticate('local'), (req, res) => { 
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

app.post("/api/registertovote", async (req, res) => {
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







// sends candidate info to candidateGallery.jsx
app.get("/api/candidate", async (req, res) => {
  try {
    const response = await Candidate.find({isSelected : false});
    //console.log(response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).send('Internal Server Error');
  }
})
.post('/api/candidate/register', upload.single('photo'), async (req, res) => {
  try {
    const { username , party, candidateName, voterID, gender } = req.body;
    // const { originalname, buffer } = req.file;
    const isSelected = false
    //  console.log(originalname,buffer);
     cloudinaryConfig()
    let uploadRes = await cloudinary.uploader.upload(
        req.file.path, {
            folder: 'test',
        }
    )
    .catch((error) => {
        console.log(error);
    });
    unlink(req.file.path, (err) => {
        if (err) throw err;
        console.log('path/file.txt was deleted');
    });
    console.log(uploadRes?.secure_url)
     

    const newCandidate = new Candidate({ 
        username,
        party, 
        candidateName, 
        voterID, 
        gender, 
        photo:uploadRes?.secure_url,// Store the Photo Link in the candidate record
        isSelected
      });
      await newCandidate.save();
      res.status(200).json({ message: 'Candidate registered successfully! Pending Approval !!' });

  } catch (error) {
    console.error('Error registering candidate:', error);
    res.status(500).json({ message: 'An error occurred while registering the candidate!' });
  }
})
.put("/api/candidate", async (req,res)=>{
const {id} = req.body
console.log(id);

try{
await Candidate.updateOne({_id : id},{isSelected: true})
 res.status(200).json({success:true,message:`${id} updated successfully`})
}catch(error){
  console.error("Error Accepting user in PUT :: /candidate " , error)
}
})
.delete('/api/candidate', async (req, res) => {
    const { id, filename } = req.body;
    try {
        const documents = await Candidate.find({ _id: id });
        console.log('Documents found:', documents);

        if (documents.length > 0) {
            await Candidate.deleteOne({ _id: id });
            console.log('Candidate deleted successfully');

            
            res.status(200).send('Candidate deleted successfully');
        } else {
            console.log('No matching documents found to delete.');
            res.status(404).send('No matching documents found');
        }
    } catch (error) {
        console.error('Error finding or deleting candidate:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body;
  try {
    // Add specific instructions to the prompt for a detailed markdown response
    const enhancedPrompt = `${prompt}\n\nPlease provide a detailed response only on Election and if the propmt question is about something else reply with "keep this chat for election related topic only" formatted in Markdown, including headings, bullet points, new line for subheading and heading and links where applicable.`;

    const result = await model.generateContent(enhancedPrompt);
   // console.log("Response =", result.response.text());
    res.status(200).json(result.response.text());
  } catch (error) {
    console.error("Error Generating Content in /chat :: post", error);
    res.status(500).json({ error: "Error generating content" });
  }
});


// session route 
app.get('/api/session', (req, res) => { 
    if (req.session.user) { 
        res.send({ user: req.session.user }); 
    } else { 
        res.send({ message: 'No active session' });
    }
}); 

// Logout route

app.get('/api/logout', function(req, res, next) {
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
