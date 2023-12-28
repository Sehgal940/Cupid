const express = require('express');
const router = express.Router();
const {v4:uuidv4}=require('uuid')
const user = require('./users.js');
const post = require('./posts.js');
const bcrypt = require('bcrypt');  
const passport=require('passport')
const flash=require('connect-flash')
const jwt=require('jsonwebtoken')
const nodemailer=require('nodemailer')
//-------------------------------------------------------------router-level-middleware 

//files upload
const multer=require('multer')
const path=require('path')
const upload=multer({
    storage:multer.diskStorage({
        destination:(req,file,cb)=>{
         cb(null,'./public/images/uploads')
        },
        filename:(req,file,cb)=>{
            const unique=uuidv4();
            cb(null,unique + path.extname(file.originalname))
        }
    })
})

//Authentication
function isAuthenticated(req,res,next){
    if(req.user)
    {
       next()
    }
    else
    {
        req.flash('error','Invalid User')
        res.render('index', { title: 'Cupid | invalid' ,msg: req.flash('error'),nav:false});
    }
}



//--------------------------------------------------------------routes

//----------------login-get/post
router.get('/', (req, res) => {
    res.render('index', { title: 'Cupid | Welcome' ,msg:'',nav:false});
});

router.post('/', passport.authenticate('local',{
    successRedirect:'/profile',
    failureRedirect: '/index',
}),(req,res,next)=>{
    next()
})

//in passport.authenticate failureredirect='/index'
router.get('/index', (req, res) => {
    req.flash('error','Invalid Credentials')
    res.render('index', { title: 'Cupid | invalid' ,msg: req.flash('error'),nav:false});
}); 



//---------------register-get/post
router.get('/register', (req, res) => {
    res.render('register', { title: 'Cupid | register' ,msg:'',nav:false });
});

router.post('/register', async (req, res) => {
    const client = await user.findOne({ username: req.body.username});
    const email=await user.findOne({email: req.body.email});
    const hashPass = await bcrypt.hash(req.body.password, 10);
    if (client) {
        req.flash('msg','username already registered')
        res.render('register',{title:'Cupid | failed', msg:req.flash('msg'),nav:false})
    } 
    else if(email)
    {
        req.flash('msg','email already registered')
        res.render('register',{title:'Cupid | failed', msg:req.flash('msg'),nav:false}) 
    }
    else 
    {
            await user.create({
                username: req.body.username,
                password: hashPass,  
                email: req.body.email,
            });
            req.flash('msg','registered successfully')
            res.render('index',{title:'Cupid | welcome',msg:req.flash('msg'),nav:false});
    }
});



//----------------logout
router.get('/logout',isAuthenticated,(req,res)=>{
    req.logout((err)=>(err))
    res.redirect('/')})



//---------------password

router.get('/forgetpass',(req,res)=>{
    res.render('pass',{title:'Cupid | password',nav:false})
})
router.post('/forgetpass', async (req, res) => {
    const email = req.body.email;
    const usermail = await user.findOne({ email: email });
  
    if (usermail) {
      const secret = 'secretkey' + usermail.password;
      const payload = {
        email: usermail.email,
        id: usermail._id,
      };
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });
      const link = `${process.env.DURL}/resetpass/${usermail._id}/${token}`;
  
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.AUTHMAILID, 
          pass: process.env.AUTHPASS, 
        },
      });
  
      // Email content
      const mailOptions = {
        from: process.env.AUTHMAILID, // Replace with your Gmail email
        to: usermail.email,
        subject: 'Reset Your Password',
        text: `Click the link below to reset your password:\n${link}`,
      };
  
      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.log(error);
        }
        else
        {
            console.log('Email sent');
        }
      });
  
      res.redirect('/');
    } 
    else 
    {
      res.redirect('/index');
    }
  });
router.get('/resetpass/:id/:token',async(req,res)=>{
    const id=req.params.id
    const token=req.params.token
    const check=await user.findOne({_id:id})
    if(check)
    {
        const secret='secretkey'+ check.password
        jwt.verify(token,secret)
        res.render('resetpassword',{title:'Cupid | newpass',nav:false})
    }
    else
    {
        res.redirect('/index')
    }
})
router.post('/resetpass/:id/:token',async(req,res)=>{
    const id=req.params.id
    const token=req.params.token
    const check=await user.findOne({_id:id})
    if(check)
    {
        const secret='secretkey'+ check.password
        jwt.verify(token,secret)
        const newpass=await bcrypt.hash(req.body.password,10)
        check.password=newpass
        await check.save()
        res.redirect('/')
    }
    else
    {
        res.redirect('/')
    }
})



//-----------------profile
router.get('/profile',isAuthenticated,async(req,res)=>{
const getUser=await user.findOne({username:req.user.username}).populate("posts")  //opening posts
const i=getUser.posts
res.render('profile',{title: 'Cupid | profile',img:getUser.profileImg,pimg:i,name:getUser?.username,nav:true,uname:'enter username'} )
})

//updatename
router.post('/editname',isAuthenticated,async(req,res)=>{
    const getu=await user.findOne({username:req.body.editname})
    const getUser=await user.findOne({username:req.user.username}).populate("posts") 
    const i=getUser.posts
    if(getu)
    {
       res.redirect('/Nvalidname')
    }
    else
    {
        getUser.username=req.body.editname
        await getUser.save()
        res.redirect('/profile')
    }
})

router.get('/Nvalidname',isAuthenticated,async(req,res)=>{
    const getUser=await user.findOne({username:req.user.username}).populate("posts")  //opening posts
    const i=getUser.posts
    res.render('profile',{title: 'Cupid | profile',img:getUser.profileImg,pimg:i,name:getUser?.username,nav:true,uname:'username exists'} )
})

//profile image
router.post('/imgupload', isAuthenticated, upload.single('image'), async (req, res) => {
    const userToUpdate = await user.findOne({ username:req.user.username });
    userToUpdate.profileImg = req.file?.filename;
    await userToUpdate.save();
    res.redirect('/profile');
});

//add post
router.get('/add',isAuthenticated,async(req,res)=>{
    res.render('add',{title: 'Cupid | add', nav:true} )
})

//post upload
router.post('/createpost', isAuthenticated, upload.single('postimg'), async (req, res) => {
    const userToUpdate = await user.findOne({ username: req.user.username});
    const p=await post.create({
        user:userToUpdate._id,
        title:req.body.title,
        description:req.body.description,
        postImg:req.file.filename
    })
    userToUpdate.posts.push(p._id)
    await userToUpdate.save()
    res.redirect('/profile')
});

//download
router.get('/download/:id',isAuthenticated,async(req,res)=>{
const id=req.params.id    
const getPost=await post.findOne({_id:id}) //opening posts
const i=getPost
res.download(`./public/images/uploads/${i.postImg}`)
})

//delete
router.get('/delete/:id',isAuthenticated,async(req,res)=>{
    const id=req.params.id
    const getPost=await post.deleteOne({_id:id}) 
    res.redirect('/profile')
})



//exports
module.exports = router;