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

var imgModel = require("./model");
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


const photoModel = require("./shopModel");

app.get("/shops/original",checkcookie, function(req,res){
  photoModel.find({}, function (err, foundItems) {
      if (err) {
        console.log(err);
      } else {
        res.render("origShop", { title: "Original", items: foundItems });
      }
    }).sort({ originalStock: 1 });

});

app.get("/shops/print",checkcookie, function (req, res) {
  photoModel
    .find({}, function (err, foundItems) {
      if (err) {
        console.log(err);
      } else {
        res.render("printShop", { title: "Print", items: foundItems });
      }
    })
    .sort({ printStock: 1 });
  
});



// ------------Image Viewer Page-------//


app.get("/images/:imageName",checkcookie, function (req, res) {
  const requestedImage = req.params.imageName;
  photoModel.find({ name: requestedImage }, function (err, foundItems) {
    if (err) {
      const cjdsn = 0;
    } else {
      if (foundItems.length === 0) {
        res.redirect("/error");
      } else {
        res.render("imageViewer", { title: "photo", image: foundItems[0] });
      }
    }
  });
});

app.post("/addToCart", function (req, res) {
  const data = req.body;
  // console.log(data);
  req.session.cart.push(data);
  res.json(data);
});


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
  photoModel.find({}, function (err, items) {
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
    originalStock: req.body.originalStock,
    originalPrice: req.body.originalPrice,
    originalSize: req.body.originalSize,
    printStock: req.body.printStock,
    printPrice: [
        { daam: req.body.printPrice1, size: req.body.printSize1 },
        { daam: req.body.printPrice2, size: req.body.printSize2 },
        { daam: req.body.printPrice3, size: req.body.printSize3 },
        { daam: req.body.printPrice4, size: req.body.printSize4 },
    ],
    desc: req.body.desc,
    img: {
      data: fs.readFileSync(
        path.join(__dirname + "/public/uploads/" + req.file.filename)
      ),
      contentType: "image/png",
    },
  };

  photoModel.create(obj, function (err, item) {
    if (err) {
      const cjdsn = 0;
    } else {
      // item.save();
      res.redirect("/photoUpload");
    }
  });
});

app.post("/deletePhoto",checkcookie, function (req, res) {
  photoModel.deleteOne({ name: req.body.name }, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/photoUpload");
      console.log("Delete Successful.");
    }
  });
});


app.get("/error",checkcookie,function(req,res){
  res.render("404",{title:"404"});
})


app.get("/cart", function(req, res){

  if(req.session.cart.length === 0){
    res.render('404',{title:'404'});

  } else {
    // console.log(req.session.cart);
    // var itemsinsession = req.session.cart;
    ids = [];
    req.session.cart.forEach(function (eachproduct) {
      ids.push(eachproduct.id);
    });
    console.log(ids);

    photoModel.find({_id : {$in: ids}}, function (err, foundItems) {
      if(err){
        console.log(err);
      }
      foundItems.forEach(function(item){
        console.log(item.name,item.id);
      })
      res.render("cart",{title:"cart",items:foundItems});
    });

  }


  
  
})



app.listen(process.env.PORT || 3000, function(){
    console.log("Server started on port " + process.env.PORT);
})
