const express=require('express')
const server=express()
require('dotenv').config()
const router=require('./routes/route.js')
const session=require('express-session')
const passport=require("passport")
const strategy=require('passport-local').Strategy
const user=require('./routes/users.js')
const bcrypt=require('bcrypt')
const flash=require('connect-flash')
const PORT=process.env.PORT || 6010
const mongoose=require('mongoose')
const uri=process.env.URL
mongoose.connect(uri)

//middlewares
server.use(express.json())
server.use(express.static('public'));
server.use(express.urlencoded({extended:true}))
server.set('view engine','ejs')
server.use(session({
    resave:false,
    saveUninitialized:false,
    secret:'secretKey'
}))
server.use(flash())
server.use(passport.initialize())
server.use(passport.session())

passport.use(new strategy(async (username, password, done) => {
    const foundUser = await user.findOne({ username: username }); // Rename the variable here
    if (foundUser) {
        const passTrue = await bcrypt.compare(password, foundUser.password);
        if (passTrue) return done(null, foundUser);
        else return done(null, false);
    }
    return done(null, false);
}));

passport.serializeUser((user, done) => {
    if (user) {
        return done(null, user._id);
    }
    return done(null, false);
});

passport.deserializeUser(async (id, done) => {
    const foundUser = await user.findById(id); // Rename the variable here
    return done(null, foundUser);
});
server.use(router)

server.listen(PORT,()=>{
    console.log('servered...')
})