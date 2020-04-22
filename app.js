const express = require('express');
const path = require('path');
const body_Parser = require('body-parser');
const session = require("express-session");
const express_handlebars = require('express-handlebars');
const multer  = require('multer')
const con = require('./db/dbcon');
con.connect();
const DIR = './public/images';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, DIR);
    },
    filename: (req, file, cb) => {
      const fileName = file.originalname.toLowerCase().split(' ').join('-');
      cb(null, fileName)
    }
  });
 
  var upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
      }
    }
  });
const app = express();
var hbs = express_handlebars.create({
  defaultLayout:'main', 
  extname: '.hbs',
  helpers: {
      truncateText : function (text,length){
      var truncatedText = text.substring(0,length);
      return truncatedText;
    }
  }
});
app.engine('.hbs', hbs.engine);
app.set('view engine','.hbs');
app.use(express.static(path.join(__dirname,'public')));
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(body_Parser.json())
app.use(body_Parser.urlencoded({ extended: false }));



app.get('/',(req,res)=>{
  con.query('Select * from post',function(error,results,fields){
    if(error){
      console.log(error)
    }else{
        // console.log(results)  
       for(let i = 0; i < Object.keys(results).length; i++){
         results[i]['body'] = results[i]['body'].substring(0, 100) +"..."
      }   
    } 
    // console.log(results)
    res.render('home',{data:results});   
  })
})
app.get('/addCategory',(req,res)=>{
    res.render('addCategory')
});
app.post('/addCategory/send',(req,res)=>{
    var category = req.body.category;
    var sql = 'INSERT into category(category) values(?)';
    con.query(sql,[category],function(err,results){
      if(!err){
        res.redirect('/addCategory')
      }
      else{
        console.log(err)
      }
    })
})
app.get('/addPost',(req,res)=>{
    var context = {};
    con.query("Select * from category",function(error,rows,fields){
      if(error){
        console.log(error);
      }
      context.results = rows;
      var categories = [];
      for(i=0; i < rows.length; i++){
        categories.push(rows[i]['category']);
      };
    res.render('addPost',{categories:categories}); 
    });      

});
app.post('/addPost/send',upload.single('image'),(req,res)=>{
    var title=req.body.title;
    var category = req.body.category;
    var body =req.body.body1;
    var image = req.file.filename;
    var author = req.body.author;
    var date = new Date();
    var time = date.toLocaleString();
    // console.log(time)

    var sql = 'INSERT into post(title,category,body,image,author,datetime) values(?,?,?,?,?,?)';
    con.query(sql,[title,category,body,image,author,time],function(error,rows,fields){
      if(error){
        console.log(error);
      }
      else{
        res.redirect('/');
      }
    })

    // console.log(req.file.filename)
});
app.get('/addPost/send/:id',post,comment,renderCmt);

app.get('/register',(req,res)=>{
  res.render('author')
});

app.post('/register/send',(req,res)=>{
  var author = req.body.author;
  var sql =  "Insert into author(author) values(?)";
  con.query(sql,[author],function(error,results){
    if(!error){
      res.render('home')
    }
    else{
      console.log(error)
    }
  })
});

app.post('/addPost/send/coment',(req,res)=>{
  var name = req.body.name;
  var email = req.body.email;
  var description = req.body.description;
  id = req.body.id;
  // var id = req.params.id;
  console.log(id)
  // console.log(name,email,comment)
  var sql = 'insert into comment(name,email,description,post_id) values(?,?,?,?)';
  con.query(sql,[name,email,description,id],function(error,results) {
    if(error){
      console.log(error);
    }else{
      res.redirect('/')
    }
    
  })
})
app.listen(3000,()=>{
    console.log('server is started at 4000')
});

function post(req,res,next){
  id = req.params.id;
  con.query("select * from post where id=?",id,function(err, rows){
    req.post=rows;
    console.log(req.post)
    return next()
  });
}

function comment(req,res,next) {
  id = req.params.id;
  con.query("Select email,description from comment where post_id=?",id,function(err,rows){
    req.comment = rows;
    console.log(req.comment)
    next();
  });
}
function renderCmt(req,res) {
  res.render('show',{
    post: req.post,
    coment: req.comment
  }); 
}

    