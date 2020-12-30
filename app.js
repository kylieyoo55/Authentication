//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const bcrypt =require("bcrypt");
const saltRounds =10;

const app=express();

console.log(process.env.API_KEY);

//connect to mongodb
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useUnifiedTopology:true});

//Schema
const userSchema= new mongoose.Schema({
    email:String,
    password:String
});



//model
const User=new mongoose.model("User",userSchema);

app.set("view engine","ejs")
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.get("/",(req,res)=>{
    res.render("home")
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
    const username=req.body.username;
    const password=req.body.password;
    // Load hash from your password DB.

    
        
            User.findOne({email:username},(err,foundUser)=>{
                if(err){console.log(err)}
                else{
                    if(foundUser){

                        bcrypt.compare(password, foundUser.password, function(err, result) {
if(result == true){
    res.render("secrets")
}

                        });
                        
                            
                        
                    }
                }
        })

  
}

)



//Register route
app.route("/register")
.get(
    (req,res)=>{
        res.render("register")
    }
)
.post((req,res)=>{
    bcrypt.hash(req.body.password,saltRounds, function(err, hash) {
        const newUser =new User({
            email:req.body.username,
            password:hash
            })
            newUser.save((err)=>{
                if(!err){res.render("secrets")}
                else{res.send(err)};
            })
    });

 
})


app.listen(3000,()=>console.log("Server 3000 is Running"))