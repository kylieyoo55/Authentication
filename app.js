

require('dotenv').config();
const express = require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");

//cookie

const session = require('express-session');
const passport= require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


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
    password:String
});

//passport-local-mongoose plugin
userSchema.plugin(passportLocalMongoose)



//schema model
const User=new mongoose.model("User",userSchema);

//passport local configuration 
passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());






app.get("/",(req,res)=>{
    res.render("home")
})

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

