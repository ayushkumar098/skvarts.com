const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const multer = require("multer");
var fs = require("fs");
var path = require("path");
// require("dotenv/config");
const dotenv = require("dotenv");
dotenv.config()


const app = express();
app.set("view engine", "ejs");

const gallerys = [{ title: "oil",subtitle: "PAINTING" },{title: "color",subtitle: "PENCIL" },{title: "graphite",subtitle: "& CHARCOAL"}];

mongoose.connect("mongodb://localhost:27017/imageDB", {
  useNewUrlParser: true,
});

app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb',extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

app.set("view engine", "ejs");

app.get("/", function(req,res){
    res.render("index" );
});

app.get("/about", function (req, res) {
  res.render("about",{ title: "About"});
});

app.get("/category", function (req, res) {
  res.render("category", { title: "Gallery" });
});

app.get("/confirm", function (req, res) {
  res.render("confirm");
});

//------------Order Page-------------//

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

var upload = multer({ storage: storage });

var imgModel = require("./model");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDERMAIL,
    pass: process.env.SENDERPASS
  },
});


app.get("/order", function (req, res) {
  res.render("order", { title: "Order" });
});


app.post("/order",upload.single("profile-file"), function(req, res, next){


  let orderContent = {
    name: req.body.name,
    phno: req.body.phno,
    addr: req.body.addr,
    paint: req.body.paint,
    canvaSize: req.body.selected,
    img: req.file,
    desc: req.body.desc,
  };

  var mailOptions = {
    from: process.env.SENDERMAIL,
    to: process.env.RECIEVERMAIL,
    subject: "Sending Email using Node.js",
    html:
      "<h1>Order Details</h1><h2>Name: " +
      orderContent.name +
      "</h2><h2>Phone Number:" +
      orderContent.phno +
      "</h2><h2>Email:" +
      orderContent.addr +
      "</h2><h2>Paint Type:" +
      orderContent.paint +
      "</h2><h2>Canva Size:" +
      orderContent.canvaSize +
      "</h2><h2>Description:" +
      orderContent.desc +
      '<h2>Attached image: </h2><img src="cid:unique@kreata.ee"/>',
    attachments: [
      {
        filename: req.file.originalname ,
        path: __dirname + "/public/uploads/"+ req.file.originalname,
        cid: "unique@kreata.ee", //same cid value as in the html img src
      },
    ],
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      const cjdsn = 0;
      // console.log(error);
    } else {
      console.log("Email sent: " + info.response);
      res.redirect("/");
    }
  });
})




//------------Gallery Page-------------//



app.get("/verylongandsecureuploadingurlthatisverylong", function(req,res){
  imgModel.find({},function(err, items){
    if(err){
      const cjdsn = 0;
    }else{
      res.render('uploading', { items: items });
    }
  })
});

app.post("/verylongandsecureuploadingurlthatisverylong", upload.single('image'), function(req,res, next){
  let obj = {
    name: req.body.name,
    cat: req.body.cat,
    price: req.body.price,
    stock: req.body.stock,
    size: req.body.size,
    desc: req.body.desc,
    img: {
        data: fs.readFileSync(path.join(__dirname + '/public/uploads/' + req.file.filename)),
        contentType: 'image/png'
      }
  }

  imgModel.create(obj, function(err, item){
    if(err){
      const cjdsn = 0;
    }
    else {
      // item.save();
      res.redirect('/verylongandsecureuploadingurlthatisverylong');
    }
  });
});



app.get("/gallerys/:galleryName", function (req, res) {
  const requestedTitle = req.params.galleryName;
  gallerys.forEach(function (gallery) {
    imgModel.find({cat: requestedTitle}, function(err, foundItems){
      if (err) {
        const cjdsn = 0;
      }else {
        
        if (requestedTitle === gallery.title) {
        res.render("gallery", { title: gallery.title,subtitle: gallery.subtitle, items: foundItems});
        }
      }
    });
  });
});

app.get("/images/:imageName", function(req, res){
  const requestedImage = req.params.imageName;
    imgModel.find({ name: requestedImage }, function (err, foundItems) {
      if (err) {
        const cjdsn = 0;
      } else {
        if(foundItems.length === 0){
          res.redirect("/error",);
        }else{
          res.render("imageViewer",{title:"photo",image:foundItems[0]});
        }

      }
    });
})


app.get("/error",function(req,res){
  res.render("404",{title:"404"});
})



// app.get("/aboutme",function(req,res){
//   res.render("aboutme",{title:"aboutme"});
// })


app.listen(process.env.PORT || 3000, function(){
    console.log("Server started on port " + process.env.PORT);
})
