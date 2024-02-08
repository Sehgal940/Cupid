const mongoose=require('mongoose')
const schema=new mongoose.Schema({
user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"userdata"  //collection name
},
title:String,
description:String,
postImg:String
})
const post=mongoose.model('posts',schema)
module.exports=post