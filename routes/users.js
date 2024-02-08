const mongoose=require('mongoose')
const uri=process.env.URL
mongoose.connect(uri)
const schema=new mongoose.Schema({
    username:{type:String},
    email:{type:String},
    password:{type:String},
    profileImg:{type:String,defalut:'image'},
    posts:[
        {
        type:mongoose.Schema.Types.ObjectId,
        ref:'posts' 
        }
    ]
})
const user=mongoose.model('userdata',schema)
module.exports=user