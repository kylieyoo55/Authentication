

require('dotenv').config();
const express = require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
//Google Oauth
var GoogleStrategy = require('passport-google-oauth20').Strategy;

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
    email:String,
    password:String,
    googleId: String
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



app.get("/",(req,res)=>{
    res.render("home")
})

//facebook auth button
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

app.get("/secrets",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
})

app.get("/logout",(req,res)=>{
    req.logOut();
    res.redirect("/");
})

//Effor handle page
app.get("/error",(req,res)=>{
    res.render("error")
})

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

