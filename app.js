const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const multer = require("multer");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config() 

const app = express();
app.set("view engine", "ejs");


app.use(
  session({
    name: "Cart",
    secret: process.env.cookie || "Sectre-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 630000,
      sameSite: true,
    },
  })
);

mongoose.connect("mongodb://localhost:27017/imageDB", {
  useNewUrlParser: true,
});

app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb',extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

app.set("view engine", "ejs");

var imgModel = require("./model");
var originalModel = require("./originalModel");
const printModel = require("./printModel");

function checkcookie(req,res,next){
  if(!req.session.cart){
    req.session.cart = [];
    next()
  } else {
    next();
  }
}


app.get("/",checkcookie, function(req,res){
  res.render("index" );
});

app.get("/about",checkcookie, function (req, res) {
  res.render("about",{ title: "About"});
});

app.get("/category",checkcookie, function (req, res) {
  res.render("category", { title: "Gallery" });
});

app.get("/shopCategory",checkcookie, function (req, res) {
  res.render("shopCategory", { title: "Shop" });
});

app.get("/confirm",checkcookie, function (req, res) {
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


const { shallowCopyFromList } = require("ejs/lib/utils");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 587,
  auth: {
    user: process.env.email,
    pass: process.env.smtppass
  },
});

app.get("/order",checkcookie, function (req, res) {
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

  var selfmail = {
    from: process.env.domainemail,
    to: process.env.email,
    subject: `New commisioned Artwork by ${orderContent.name}`,
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
      orderContent.desc,
    attachments: [
      {
        filename: req.file.originalname ,
        path: __dirname + "/public/uploads/"+ req.file.originalname,
        cid: "unique@kreata.ee", //same cid value as in the html img src
      },
    ],
  };

  transporter.sendMail(selfmail, function (error, info) {
    if (error) {
      const cjdsn = 0;
      // console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  var customermail = {
    from: process.env.domainemail,
    to: orderContent.addr,
    subject: "Order Placed!",
    html:
    "<center>Thank you, your order has been placed</center>",
  };

  transporter.sendMail(customermail, function (error, info) {
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


const gallerys = [
  { title: "oil", subtitle: "PAINTING" },
  { title: "color", subtitle: "PENCIL" },
  { title: "graphite", subtitle: "& CHARCOAL" },
];

app.get("/gallerys/:galleryName",checkcookie, function (req, res) {
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


// -----------SHOP PAGE-------------//


app.get("/shops/original",checkcookie, function(req,res){
  originalModel.find({}, function (err, foundItems) {
      if (err) {
        console.log(err);
      } else {
        res.render("origShop", { title: "Original", items: foundItems });
      }
    }).sort({ originalStock: 1 });

});

app.get("/shops/print",checkcookie, function (req, res) {
  printModel.find({}, function (err, foundItems) {
      if (err) {
        console.log(err);
      } else {
        res.render("printShop", { title: "Print", items: foundItems });
      }
    })
    .sort({ printStock: 1 });
  
});



// ------------Image Viewer Page-------//


app.get("/images/:type/:imageName",checkcookie, function (req, res) {
  const requestedType = req.params.type;
  const requestedImage = req.params.imageName;
  


  var alreadypresent;
  if(!req.session.cart.find(o => o.name === requestedImage)){
    alreadypresent = false;
  }else{
    alreadypresent = true;
  }

  if (requestedType == "original") {
    originalModel.find({ name: requestedImage }, function (err, foundItems) {
      if (err) {
        const cjdsn = 0;
      } else {
        if (foundItems.length === 0) {
          res.redirect("/error");
        } else {
          res.render("imageViewer", { title: "photo", image: foundItems[0],alreadypresent: alreadypresent });
        }
      }
    });
  }

  if(requestedType == "print"){
    printModel.find({ name: requestedImage }, function (err, foundItems) {
      if (err) {
        const cjdsn = 0;
      } else {
        if (foundItems.length === 0) {
          res.redirect("/error");
        } else {
          res.render("imageViewer", { title: "photo", image: foundItems[0],alreadypresent: alreadypresent });
        }
      }
    });
  }
  
});

app.post("/addToCart",checkcookie,function (req, res) {
  // const data = req.body;
  // console.log(data);
  // req.session.cart.push(data);
  


  var foundItem;
  data = req.body; // {id,size}
  // console.log(data);
  printModel.find({_id: data.id},function(err,foundPrint){
    if(err){
      console.log(err);
    }else {
      originalModel.find({_id : data.id},function(err,foundOriginal){
        if(err){
          console.log(err)
        }else{
          //main code

          // console.log(foundOriginal.length);
          // console.log(foundPrint.length);
          if(foundOriginal.length != 0){
            foundItem = foundOriginal[0];
          }
          if(foundPrint.length != 0){
            foundItem = foundPrint[0];
          }
          var price;
          foundItem.priceInfo.forEach(function(iter){
            if(data.size == iter.size){
              price = iter.price;
            }
          })

          req.session.cart.push({
            id: data.id,
            type: foundItem.type,
            size: data.size,
            name: foundItem.name,
            price: price,
          })
          res.json(data);
        }
      })
    }
  })
});


app.post('/deletefromcart',checkcookie,function(req,res){
  todelete = req.body.id;
  req.session.cart = req.session.cart.filter(function(obj){
    return obj.id != todelete;
  })
  res.redirect('/cart');

})


// -----------Uploading Page---------//


app.get("/verylongandsecureuploadingurlthatisverylong", function (req, res) {
  imgModel.find({}, function (err, items) {
    if (err) {
      const cjdsn = 0;
    } else {
      res.render("uploading", { items: items });
    }
  });
});

app.post("/verylongandsecureuploadingurlthatisverylong", upload.single("image"), function (req, res, next) {
    let obj = {
      name: req.body.name,
      cat: req.body.cat,
      img: {
        data: fs.readFileSync(
          path.join(__dirname + "/public/uploads/" + req.file.filename)
        ),
        contentType: "image/png",
      },
    };

    imgModel.create(obj, function (err, item) {
      if (err) {
        const cjdsn = 0;
      } else {
        // item.save();
        res.redirect("/verylongandsecureuploadingurlthatisverylong");
      }
    });
  }
);

app.post("/delete", function (req, res) {
  imgModel.deleteOne({ name: req.body.name }, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/verylongandsecureuploadingurlthatisverylong");
      console.log("Delete Successful.");
    }
  });
});


// ---------photo upload Page---------//


app.get("/photoUpload",checkcookie, function (req, res) {
  originalModel.find({}, function (err, items) {
    if (err) {
      const cjdsn = 0;
    } else {
      res.render("photoUpload", { items: items });
    }
  });
});

app.post("/photoUpload", upload.single("image"), function (req, res, next) {
  let obj = {
    name: req.body.name,
    cat: req.body.cat,
    type: req.body.type,
    stock: req.body.stock,
    priceInfo: [
      { price: req.body.price1, size: req.body.size1 },
      { price: req.body.price2, size: req.body.size2 },
      { price: req.body.price3, size: req.body.size3 },
      { price: req.body.price4, size: req.body.size4 },
    ],
    desc: req.body.desc,
    img: {
      data: fs.readFileSync(
        path.join(__dirname + "/public/uploads/" + req.file.filename)
      ),
      contentType: "image/png",
    },
  };
  
  const type = req.body.type;

  if(type == "original"){
    originalModel.create(obj, function (err, item) {
      if (err) {
        const cjdsn = 0;
      } else {
        // item.save();
        res.redirect("/photoUpload");
      }
    });
  }

  if(type == "print"){
    printModel.create(obj, function (err, item) {
      if (err) {
        const cjdsn = 0;
      } else {
        // item.save();
        res.redirect("/photoUpload");
      }
    });
  }
  
});

app.post("/deletePhoto",checkcookie, function (req, res) {
  const type = req.body.type;

  if(type == "original"){
    originalModel.deleteOne({ name: req.body.name }, function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/photoUpload");
        console.log("Delete Successful.");
      }
    });
  }

  if(type == "print"){
    printModel.deleteOne({ name: req.body.name }, function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/photoUpload");
        console.log("Delete Successful.");
      }
    });
  }
});


app.get("/error",checkcookie,function(req,res){
  res.render("404",{title:"404"});
})


app.get("/cart",checkcookie, function(req, res){

  if(req.session.cart == undefined || req.session.cart.length === 0){
    res.render('404',{title:'404'});

  } else {
    console.log(req.session.cart);
    ids = []
    images = []
    req.session.cart.forEach(function(item){
      ids.push(item.id);
    })
    printModel.find({_id : {$in : ids}},function(err,foundPrint){
      if(err){
        console.log(err);
      }else{
        originalModel.find({_id : {$in : ids}},function(err,foundOriginal){
          if(err){
            console.log(err);
          }else{
            foundOriginal.forEach(function(item){
              images.push({id : item.id, image : item.img})
            });
            foundPrint.forEach(function(item){
              images.push({id : item.id, image : item.img})
            });
            
            res.render('cart',{title: 'Cart', items: req.session.cart, images : images});
          }
        });
      }

    });
  }
  
})



app.listen(process.env.PORT || 3000, function(){
    console.log("Server started on port " + process.env.PORT);
})
