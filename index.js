import { name } from "ejs";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import pool from "./db";

const app = express();

const users = [];

//Using Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Setting up View Engine
app.set("view engine", "ejs");

const isAuthenticated = function(req, res, next){
    const { token } = req.cookies;
    if(token){
        next();
    } else{
        res.render("login");
    }
};

app.get("/", isAuthenticated, function(req, res){
    req.render("logout");
});

app.post("/login", async function(req, res){
    const { name, email } = req.body;

    const user = await User.create({
        name,
        email,
    })
});

res.cookie("token", user._id, {
    httpOnly: true,
    expires: new Date(Date.now()),
})

app.get("/login", function(req, res){
    console.log(req.cookies);

    res.render("login");
});

//Start the Express server
app.listen(3000, function(){
console.log("server is working");
});