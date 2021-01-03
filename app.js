

require('dotenv').config();
const express = require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
//Google Oauth
var GoogleStrategy = require('passport-google-oauth20').Strategy;

//facebook
const FacebookStrategy = require('passport-facebook').Strategy;

//require find or create
var findOrCreate = require("mongoose-findorcreate")

//cookie
var session = require('express-session');
var passport= require("passport");
var passportLocalMongoose = require("passport-local-mongoose");


const app=express();



app.set("view engine","ejs")
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
    secret:"This is my real code.",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());

app.use(passport.session());



 //connect to mongodb
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useUnifiedTopology:true});
//get rid off the warning
mongoose.set('useCreateIndex', true);

//Schema
const userSchema= new mongoose.Schema({
    facebook_name: String,
    email:String,
    password:String,
    googleId: String,
    facebook_id : String,
    secret: String
});

//passport-local-mongoose plugin
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate);


//schema model
const User=new mongoose.model("User",userSchema);

//passport local configuration 
passport.use(User.createStrategy());
 

//serialised user
passport.serializeUser((user,done)=>{
    done(null, user.id );
});
passport.deserializeUser((id,done)=>{
    User.findById(id,(err,user)=>{
        done(err,user);
    });
});


//Google Strategy(have to be below serialised)
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Facebook strategy for use by Passport.
passport.use(new FacebookStrategy({ //This is class constructor argument telling Passport to create a new Facebook Auth Strategy
    clientID: "3827734500624489",
    //process.env.FACEBOOK_CLIENT_ID,//The App ID generated when app was created on https://developers.facebook.com/
    clientSecret: "c23e2f283bdde31329577447b4c7bc8d",
    //process.env.FACEBOOK_CLIENT_SECRET,//The App Secret generated when app was created on https://developers.facebook.com/
    callbackURL: 'http://localhost:3000/auth/facebook/secrets',
    profile: ['id', 'displayName'] // You have the option to specify the profile objects you want returned
  },
  function(accessToken, refreshToken, profile, done) {
console.log(profile);
User.findOrCreate({facebook_id: profile.id ,facebook_name: profile.displayName },
    (err,user)=>{
        return done(err,user);
    });
  }
));



app.get("/",(req,res)=>{
    res.render("home")
})

//facebook redirect route
app.get("/auth/facebook",passport.authenticate("facebook",{scope:"email"}))

//facebook auth button
app.get('/auth/facebook/secrets',
 passport.authenticate('facebook',{failureRedirect:"/error"}),
 function(req,res){
     res.redirect("/secrets");
 }
);

//google auth button
app.get("/auth/google",
    passport.authenticate("google",{scope: ["profile"]})
);

//google redirect route
app.get("/auth/google/secrets",
passport.authenticate("google",{failureRedirect:"/error"}),
function(req,res){
    res.redirect("/secrets");
}
);

//secret page
app.get("/secrets",(req,res)=>{
User.find({secret:{$ne:null}},(err,foundUsers)=>{
    if(err){
        console.log(err);
    }else{
        if(foundUsers){
            res.render("secrets",{usersWithSecret:foundUsers})
            };
        }
    }
)
})


app.get("/logout",(req,res)=>{
    req.logOut();
    res.redirect("/");
})

//Effor handle page
app.get("/error",(req,res)=>{
    res.render("error")
})

//summit route
app.route("/submit")
.get((req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/error");
    }})
.post(
(req,res)=>{
    const submitedSecret = req.body.secret;
    const userId=req.user.id;

    console.log(userId);
    User.findById(userId,(err,foundUser)=>{
        if(err){
           console.log(err);
        }else{
        if(foundUser){
            foundUser.secret = submitedSecret;
            foundUser.save(()=>res.redirect("/secrets"))
        }      
    }
    })

}
)





//Login Route
app.route("/login").
get(
    (req,res)=>{
        res.render("login")
    }
)
.post(
(req,res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user,(err)=>{
       if(err){
           console.log(err);
        
       }else{
           passport.authenticate("local",{
            successRedirect: "/secrets",
            failureRedirect: "/error"
        })(req,res,()=>{
            //    res.redirect("/secrets");
           });
       }
    })
})



//Register route
app.route("/register")
.get(
    (req,res)=>{
        res.render("register")
    }
)
.post((req,res)=>{
User.register({username:req.body.username},
    req.body.password,
    (err,user)=>{
        if(err){
            res.redirect("/error")
        }else{
            passport.authenticate("local")(req,res,()=>res.redirect("/secrets"));
        }
    })
 
})


app.listen(3000,()=>console.log("Server 3000 is Running"))

