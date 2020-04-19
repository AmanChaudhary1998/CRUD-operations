const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const Joi = require('joi');
const app = express();
const schema = Joi.object().keys({
  todo :Joi.string().required()
});

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const db = require("./db");
const collection = 'todo';

app.get('/',(req,res)=>{
  res.sendFile(path.join(__dirname,'index.html'));
});

//-----------------READ------------------------
app.get('/getTodos',(req,res)=>{
  db.getDB().collection(collection).find({}).toArray((err,documents)=>{
    if(err){
      console.log(err);
    }else{
      console.log(documents);
      res.json(documents);
    }
  });
});

//---------------------------------UPDATE-------------------------
app.put('/:id',(req,res)=>{
  const todoID = req.params.id;
  const userInput = req.body;

  db.getDB().collection(collection).findOneAndUpdate({_id:db.getPrimeryKey(todoID)},{$set: {todo : userInput.todo}},{returnOriginal: false},(err,result)=>{
    if(err){
      console.log(err);
    }else{
      res.json(result);
    }
  });
});


//---------------CREATE----------------------------

app.post('/',(req,res,next)=>{
  const userInput = req.body;

  Joi.validate(userInput,schema,(err,result)=>{
    if(err){
      const error = new Error("Invalid Input");
      error.status = 400;
      next(error);
    }else{
      db.getDB().collection(collection).insertOne(userInput,(err,result)=>{
        if(err){
          const error = new Error("Fail to Insert document");
          error.status = 400;
          next(error);
        }else{
          res.json({result:result,document: result.ops[0],msg:"successful inserted",error:null});
        }
      });
    }
  });

});

//----------------------DELETE-----------------------

app.delete('/:id',(req,res)=>{
  const todoID = req.params.id;

  db.getDB().collection(collection).findOneAndDelete({_id: db.getPrimeryKey(todoID)},(err,result)=>{
    if(err){
      console.log(err);
    }else{
      res.json(result);
    }
  });
});

//-------------------Custom Error Handler----------------------------
app.use((err,req,res,next)=>{
  res.status(err.status).json({
    error:{
      message: err.message
    }
  });
});

//-----------ESTABLISH CONNECTION----------------------

db.connect((err)=>{
  if(err){
    console.log("unable to connect the application");
    process.exit(1);
  }else{
    app.listen(PORT,()=>{
      console.log(`connected to database, app listen on port:${PORT}`);
    });
  }
})
