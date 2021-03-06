const express = require('express')
const app = express()
var fs = require("fs");
const fileUpload = require('express-fileupload');

var path = require("path");
var findInFiles = require('find-in-files');

var multiparty = require('multiparty');

var _ = require('underscore-node');

var bodyParser = require('body-parser')

var FormData = require('form-data');

var MongoClient = require('mongodb').MongoClient;
var db_url = "mongodb+srv://bouda:B0uda-bouda!@foodservice-wnasg.mongodb.net/test?retryWrites=true";
var ObjectId = require('mongodb').ObjectID;

var session = require('express-session');

let router = express.Router();
app.use(router);

app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: true
  }
}))

// for parsing application/json
// var jsonParser = bodyParser.json()
app.use(bodyParser.json());
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
  extended: true
})

app.use(urlencodedParser);

// for parsing application/x-www-form-urlencoded
app.use(fileUpload({
  limits: {
    fileSize: 50 * 1024 * 1024
  },
}));

app.use("/public", express.static('public'));
app.use("/uploads", express.static('uploads'));

app.set('view engine', 'pug')



let foodList;
let foodChoices;
var sess;

global.user_places;
global.user_foods;


// ___GET LOGIN PAGE 
app.get('/', (req, res) => {

  sess = req.session;

  res.render('login', {
    pageTitle: 'Food Info Service Menu',
    message: 'Food Service Login Page'
  })

});
// END___GET LOGIN PAGE 

// ___GET LOGIN PAGE 
app.get('/login', (req, res) => {

  sess = req.session;

  res.redirect("/");

});
// END___GET LOGIN PAGE 

// old version routes
// old version routes
// old version routes

// ___GET page Home 
app.get('/index', (req, res) => {

  sess = req.session;

  res.render('index', {
    pageTitle: 'Food Info Service Menu',
    message: 'Hello there!'
  })
});

// ___POST upload FROM APPLICATION
app.post('/upload', function (request, response) {

  sess = req.session;

  var outDir = path.join(__dirname, "uploads");

  try {
    var Throttle = require("stream-throttle").Throttle;
    var fileName = request.headers["file-name"].replace(/ /g, '');

    console.log("filename : " + fileName);

    if (console) {
      console.log(request.method + "Request! Content-Length: " + request.headers["content-length"] + ", file-name: " + fileName);
      console.dir(request.headers);
    }
    let file = fileName.split(".");
    // var out = path.join(outDir, "upload-" + new Date().getTime() + "-" + fileName);
    var out = path.join(outDir, file[0] + "-" + new Date().getTime() + "." + file[1]);

    if (console) {
      console.log("Output in: " + out);
    }

    var total = request.headers["content-length"];
    var current = 0;

    var shouldFail = request.headers["should-fail"];

    // throttle write speed to 4MB/s
    request.pipe(new Throttle({
      rate: 1024 * 4096
    })).pipe(fs.createWriteStream(out, {
      flags: 'w',
      encoding: null,
      fd: null,
      mode: 0666
    }));

    request.on('data', function (chunk) {
      current += chunk.length;

      if (shouldFail && (current / total > 0.25)) {
        if (console) {
          console.log("Error ");
        }
        var body = "Denied!";
        response.writeHead(408, "Die!", {
          "Content-Type": "text/plain",
          "Content-Length": body.length,
          "Connection": "close"
        });
        response.write(body);
        response.end();
        shouldFail = false;
        if (console) {
          console.log("Terminated with error: [" + out + "]: " + current + " / " + total + "  " + Math.floor(100 * current / total) + "%");
        }
      } else {
        if (console) {
          console.log("Data [" + out + "]: " + current + " / " + total + "  " + Math.floor(100 * current / total) + "%");
        }
      }
    });

    request.on('end', function () {
      setTimeout(function () {
        if (console) {
          console.log("Done (" + out + ")");
        }
        var body = "Upload complete!";
        response.writeHead(200, "Done!", {
          "Content-Type": "text/plain",
          "Content-Length": body.length
        });
        response.write(body);
        response.end();
      }, 1000);
    });

    request.on('test', function () {
      console.log("cwejdwwew");
    });

    if (console) {
      request.on('error', function (e) {
        console.log('error!');
        console.log(e);
      });
    }
  } catch (e) {
    if (console) {
      console.log(e);
    }
    throw e;
  }
});
// END___POST upload FROM APPLICATION

// ___GET IMAGE URL
app.get("/getImage/:image", (req, res) => {

  sess = req.session;

  console.log(req.params.image);

  let _folder = "./uploads/";
  let picturesList = [];
  pictureUrl = [];

  var id = req.params.image;

  console.log('id ' + id);

  fs.readdir(_folder, (err, files) => {
    files.forEach(file => {
      picturesList.push(file);
    });

    picturesList.forEach(function (value, index) {

      if (value.indexOf(id) !== -1) {
        pictureUrl.push(value);
      }
    });

    if (pictureUrl.length == 1 && pictureUrl[0].indexOf("-validated") != -1) {
      console.log("image validated");
      res.end(pictureUrl[0]);

    } else {
      console.log("image non validated");
      res.end("noimage");
    }

  });

});
// END___GET IMAGE URL

// NEED DEBUG
// ___POST upload FROM ADMIN PANEL AND DELETE OTHER PENDING PHOTOS
app.post('/uploadAdmin/:foodId', function (req, res) {

  sess = req.session;

  // console.log(req.params.foodId);

  let _folder = "./uploads/";
  let picturesList = [];
  pictureUrl = [];

  var url = req.params.foodId.replace(/ /g, '');

  console.log(`url : ${url}`);

  // Loop for images to get array of urls related to this food item
  fs.readdir(_folder, (err, files) => {
    files.forEach(file => {
      picturesList.push(file);
    });

    picturesList.forEach(function (value, index) {

      // console.log(' value.indexOf(url[0] ' + value.indexOf(url[0]));

      // console.log(' value.indexOf(url[0] ' + value);

      // console.log(' url ' + url);
      // console.log(' value ' + value);

      // console.log(' value.indexOf(url[0] ' + value.indexOf(url[0]));

      if (value.indexOf(url) !== -1) {
        pictureUrl.push(value);
        console.log(`pictureUrl value : ${value}`)
      }
    });



    // Rename the image selected for validation 

    if (!req.files)
      return res.status(400).send('No files were uploaded.');

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.picture;
    let ext = sampleFile.name.split(".")[1];

    // here need code

    // console.log(pictureUrl);

    pictureUrl.forEach((_url) => {
      console.log(_url);
      fs.unlink(`./uploads/${_url}`, (err) => {
        if (err) throw err;
        console.log(`successfully deleted ./uploads/${_url}`);
        // Use the mv() method to place the file somewhere on your server

      });

    });

    sampleFile.mv(`./uploads/${url}-validated.${ext}`, function (err) {
      if (err)
        return res.status(500).send(err);

    });

    // res.render('uploaded', {
    //   pageTitle: 'File uploaded - ADMIN PANEL'
    // });

    res.redirect("/admin_dashboard");

  });

});
// END___POST upload FROM ADMIN PANEL AND DELETE OTHER PENDING PHOTOS

// ___GET LIST of pictures pending and validated
app.get("/listImage", (request, response) => {

  sess = req.session;

  // var compiled = _.template(``);

  // get the pictures in uploads folder and put them in list
  let _folder = "./uploads/";
  let picturesList = [];
  let pictureGroupsNonValidated = [];
  let pictureGroupsYesValidated = [];
  let picturesGroupsFantome = []

  // pictures non-validated

  // loop over all images in uploads folder  
  fs.readdir(_folder, (err, files) => {
    files.forEach(file => {
      // pushh all the files
      picturesList.push(file);
    });
    picturesList.forEach(function (value) {
      // push only unique instances if not validated
      if (!_.contains(pictureGroupsNonValidated, value.split("-")[0]) && value.indexOf("-validated") == -1) {
        pictureGroupsNonValidated.push(value.split("-")[0]);
      }
    });

    // pictures validated
    picturesList.forEach(function (value) {
      // push only unique instances if not validated
      if (!_.contains(pictureGroupsYesValidated, value.split("-")[0]) && value.indexOf("-validated") != -1) {
        pictureGroupsYesValidated.push(value.split("-")[0]);
      }
    });

    // retreive the id_name_place pattern from foodList
    let patterns = [];
    foodList.forEach(function (value) {
      patterns.push(`${value.id}_${value.name.replace(/ /g, '')}_${value.place.replace(/ /g , '')}`);
    })

    // pictures fantome that exist but no reference in database
    picturesList.forEach(function (value) {
      const _name = value.split("-")[0];
      if (patterns.indexOf(_name) > -1) {

      } else {
        picturesGroupsFantome.push(_name);
        console.log(`${_name} is a fantome picture`);
      }
    });

    response.render('list_image', {
      pageTitle: 'Images List - ADMIN PANEL',
      picsNon: pictureGroupsNonValidated,
      picsYes: pictureGroupsYesValidated,
      picsFantome: picturesGroupsFantome

    })

  });

}); // END___GET LIST of pictures pending and validated

// not working 
// ___GET MANAGE/UPDATE/DELEE VALIDATED PHOTO OF FOODS
app.get("/foodValidate/:foodId/:validated", (req, res) => {


  sess = req.session;
  let _folder = "./uploads/";
  let picturesList = [];
  pictureUrl = [];

  var id = req.params.foodId;
  var validated = req.params.validated;

  fs.readdir(_folder, (err, files) => {
    files.forEach(file => {
      picturesList.push(file);
    });

    picturesList.forEach(function (value, index) {

      if (value.indexOf(id) !== -1) {
        pictureUrl.push(value);
      }
    });

    // console.log(pictureGroups);

    console.log("pictureUrl : " + pictureUrl);


    if (req.params.validated === "yes") {
      console.log("validated");
      res.render('image_validated_manage.pug', {
        pageTitle: 'SHOW/UPDATE PHOTO OF VALIDATED FOOD',
        pics: pictureUrl,
        pic_name: id,
        validated: validated,
        user: sess.user[0]
      })
    } else if (req.params.validated === "non") {
      console.log("SHOW/UPDATE PHOTO OF LIST OF PENDING FOOD");
      res.render('image_pending_manage.pug', {
        pageTitle: 'MANAGE/UPDATE/DELEE VALIDATED PHOTO OF FOODS',
        pics: pictureUrl,
        pic_name: id,
        validated: validated,
        user: sess.user[0]
      })
    }


  });

}); // END___GET MANAGE/UPDATE/DELEE VALIDATED PHOTO OF FOODS

// ___GET TABLE LIST OF ALL FOODS
app.get("/foodList", (req, res) => {

  sess = req.session;

  let foodImages = [];
  let picturesList = [];
  let _folder = "./uploads/";
  let picturesUrl = [];
  let pictureState = "";

  // update the foodList

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    dbo.collection("foods").find({}).toArray(function (err, result) {
      if (err) throw err;
      foodList = result;
      db.close();

      // get all files in List
      fs.readdir(_folder, (err, files) => {
        files.forEach(file => {
          picturesList.push(file);
        });
        // console.dir(picturesList);

        // for each food in the list search for images related to it
        foodList.forEach(food => {



          picturesList.forEach(function (value, index) {


            // console.log(value.indexOf(`indexof : ${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}`) !== -1)



            if (value.indexOf(`${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}`) !== -1) {

              // console.log(`${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}`);
              // console.log(value);

              picturesUrl.push(value);

              console.log("value " + value);


            }



          });

          // console.log(food.id)
          // console.dir(picturesUrl);

          if (picturesUrl.length == 0) {
            pictureState = `<a href="/uploadNewImage/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}"><span style='color:red;'> no photo </span> </a>`;
            // console.log("no photo");
          } else if (picturesUrl.length == 1) {

            if (picturesUrl[0].indexOf("-validated") != -1) {
              // console.log("validated");
              pictureState = `<a href="/foodValidate/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/yes"><span style='color:green;'> validated  </span></a>`;
            } else {
              // console.log("1 pending");
              pictureState = `<a href="/foodValidate/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/non"><span style='color:orange;'> 1 pending <i class="far fa-clock"></i>  </span>   </a>     `;
            }

          } else {
            // console.log(`${picturesUrl.length} pending`);
            pictureState = `<a href="/foodValidate/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/non"><span style='color:orange;'>  ${picturesUrl.length} pending <i class="far fa-clock"> </i>  </span>  </a>    `;
          }

          // pictureimages is array of ids and pictures
          foodImages.push({
            id: food.id,
            images: picturesUrl,
            state: pictureState
          });

          picturesUrl = [];

        });

        // console.log(foodImages);

        res.render('list_foods', {
          pageTitle: 'Listof all foods - ADMIN PANEL',
          foodList: foodList,
          images: foodImages
        })

      });

    });
  });

}) // END___GET TABLE LIST OF ALL FOODS


// ___GET Validate A Picture from PENDING IMAGES
app.get("/validate/:foodId", (req, res) => {

  sess = req.session;

  // need to validate one pictures and remove all others related to this food Item
  console.log("params : " + req.params.foodId);

  let _folder = "./uploads/";
  let picturesList = [];
  pictureUrl = [];

  var url = req.params.foodId.split("-");

  // Loop for images to get array of urls related to this food item
  fs.readdir(_folder, (err, files) => {
    files.forEach(file => {
      picturesList.push(file);
    });

    picturesList.forEach(function (value, index) {

      if (value.indexOf(url[0]) !== -1) {
        pictureUrl.push(value);
      }
    });

    // Rename the image selected for validation 

    var ext = url[1].split(".")[1];

    fs.rename(`./uploads/${url[0]}-${url[1]}`, `./uploads/${url[0]}-validated.${ext}`, (err) => {
      if (err) throw err;
      console.log('Rename complete!');
    });

    // Delete all other pictures related to this food item
    var index = pictureUrl.indexOf(`${url[0]}-${url[1]}`);
    var deleted = pictureUrl.splice(index, 1);

    pictureUrl.forEach((url) => {
      fs.unlink(`./uploads/${url}`, (err) => {
        if (err) throw err;
        console.log(`successfully deleted ./uploads/${url}`);
      });

    });

    res.redirect("/admin_dashboard");

  });

}); //  ___GET Validate A Picture from PENDING IMAGES







// NON image part

// __GET all food JSON
app.get('/allFood', function (req, res) {

  sess = req.session;

  res.json(foodList);
}) // END__GET all food JSON

// ___GET food by id JSON
app.get('/food/:id', function (req, res) {

  sess = req.session;

  const id = req.params.id;
  let _food;

  foodList.forEach(food => {

    if (food.id == id) {
      _food = food;
    }
  });
  console.dir(_food);
  res.json(_food);
}) // END___GET food by id JSON


// ___GET all Places JSON
app.get('/places', function (req, res) {

  sess = req.session;

  let places = [];

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    dbo.collection("foods").distinct("place", function (err, result) {
      places = ["All", ...result];
      res.json(places);
      console.log(places);
    })
  });
}) // ___GET all Places JSON

// ___GET food by budget JSON
app.get('/budgetFood/:budget', function (req, res) {

  sess = req.session;

  // todo mongodb
  const budget = req.params.budget;
  let foodListFiltred = [];

  foodList.forEach(food => {
    if (Number(food.price) <= Number(budget) && food.admin_validated) {
      foodListFiltred.push(food);
    }
  });

  res.json(foodListFiltred);
}) // END___GET food by budget JSON

// ___GET filter food by category JSON
app.get('/categoryFood/:budget/:category', function (req, res) {

  sess = req.session;

  // todo mongodb

  const budget = req.params.budget;
  const category = req.params.category;

  console.log(`budget : ${budget} && category: ${category}`);

  let foodListFiltred = [];

  foodList.forEach(food => {
    if (Number(food.price) <= Number(budget) && food.category === category) {
      foodListFiltred.push(food);
    }
  });
  res.json(foodListFiltred);
}) // END___GET filter food by category JSON

// ___GET filter food by place JSON
app.get('/placeFood/:budget/:place', function (req, res) {

  sess = req.session;

  // todo mongodb

  const budget = req.params.budget;
  const place = req.params.place;

  console.log(`budget : ${budget} && place: ${place}`);

  let foodListFiltred = [];
  console.log(place);
  foodList.forEach(food => {
    const food_place = food.place.replace(/ /g, '');
    if (Number(food.price) <= Number(budget) && food_place === place) {
      foodListFiltred.push(food);
    }
  });

  res.json(foodListFiltred);
}) // END___GET filter food by place JSON

// ___GET filter food by category and place JSON
app.get('/categoryAndPlaceFood/:budget/:category/:place', function (req, res) {
  // todo mongodb
  sess = req.session;

  const budget = req.params.budget;
  const place = req.params.place;
  const category = req.params.category;

  console.log(`budget : ${budget} && place: ${place} && category: ${category}`);

  let foodListFiltred = [];

  foodList.forEach(food => {
    const food_place = food.place.replace(/ /g, '');
    if (Number(food.price) <= Number(budget) && food_place === place && food.category === category) {
      foodListFiltred.push(food);
    }
  });

  res.json(foodListFiltred);
}) // ___GET filter food by category and place JSON

// ___GET Upload FIRST image for food with no image -ADMING PANEL
app.get("/uploadNewImage/:url", (req, res) => {

  sess = req.session;

  res.render('upload_first_img', {
    pic_name: req.params.url,
    picUrl: req.params.url
  });



}); // END___GET Upload image for food with no image -ADMING PANEL

// ___GET delete food item from list
app.get("/foodDelete/:foodId", (req, res) => {

  sess = req.session;

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    var toDelete = {
      id: Number(req.params.foodId)
    };
    dbo.collection("foods").deleteOne(toDelete, function (err, obj) {
      if (err) throw err;
      console.log("1 food deleted");
      db.close();

      res.redirect("/foodList");

    });
  });
}); // END___GET delete food item from list

// ___GET delete IMAGE OF FOOD 
app.get("/imagesRemove/:imagePattern", (req, res) => {

  sess = req.session;

  let _folder = "./uploads/";
  let picturesList = [];
  pictureUrl = [];

  var url = req.params.imagePattern;

  console.log(url);

  // Loop for images to get array of urls related to this food item
  fs.readdir(_folder, (err, files) => {
    files.forEach(file => {
      picturesList.push(file);
    });

    picturesList.forEach(function (value, index) {

      if (value.indexOf(url) !== -1) {
        pictureUrl.push(value);
      }
    });

    console.dir(pictureUrl);
    // loop over folder and delete all urls in pictureUrl
    pictureUrl.forEach((url) => {
      fs.unlink(`./uploads/${url}`, (err) => {
        if (err) throw err;
        console.log(`successfully deleted ./uploads/${url}`);
      });
    });

    res.redirect("/listImage");

  });

}); // ___GET delete IMAGE OF FOOD

// ___POST ADD FOOD ITEM TO LIST
app.post("/foodAdd", urlencodedParser, (req, res) => {

  sess = req.session;

  if (!req.body) return res.sendStatus(400)

  // var maxId;

  // // get max id for autogeneration
  // MongoClient.connect(db_url, function (err, db) {
  //   if (err) throw err;
  //   var dbo = db.db("foodservice");
  //   dbo.collection("foods").find({}, {
  //     id: 1
  //   }).sort({
  //     id: -1
  //   }).toArray(function (err, result) {
  //     if (err) throw err;

  //     db.close();
  //     maxId = result[0].id;
  //     console.log(maxId);
  //     maxId = Number(maxId);
  //     let _id = ++maxId;
  //     console.log(`max : ${maxId} , new : ${_id}`);
  //     // Add food Item
  //     MongoClient.connect(db_url, function (err, db) {
  //       if (err) throw err;
  //       var dbo = db.db("foodservice");
  //       var foodToAdd = {
  //         id: _id,
  //         name: req.body.name,
  //         place: toTitleCase(req.body.place),
  //         price: req.body.price,
  //         category: req.body.category
  //       };
  //       dbo.collection("foods").insertOne(foodToAdd, function (err, res) {
  //         if (err) throw err;
  //         console.log("1 Food Item inserted");
  //         db.close();
  //       });
  //     });

  //   });
  // });

  res.redirect('/foodList');

}) // END___POST ADD FOOD ITEM TO LIST

// ___GET PLACE INFO BY ID
app.get("/getPlaceInfo/:place", (req, res) => {

  sess = req.session;

  let _place = req.params.place.toLowerCase();
  console.log("place is :" + _place);
  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    var query = {
      name: _place
    };
    dbo.collection("places").find(query).toArray(function (err, result) {
      if (err) throw err;
      console.log(result);
      db.close();
      res.json(result);
    });
  });
}); // END___GET PLACE INFO BY ID

// ___GET LIST OF PLACES
app.get("/listPlaces", (req, res) => {

  sess = req.session;

  // get all unique places in foods place field database
  let _distinctPlaces = [];
  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
  });

  // console.dir(_distinctPlaces);

  // get all places in places collection database
  let _places = [];
  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");

    dbo.collection("foods").distinct("place", function (err, result) {
      _distinctPlaces = result;
    });

    dbo.collection("places").find({}).toArray(function (err, result) {
      if (err) throw err;
      _places = result;
      db.close();


      // get only names from _places collections
      let placesName = [];
      for (let i = 0; i < _places.length; i++) {
        const element = _places[i];
        placesName.push(element.name);
      }

      let _distinctPlacesNoSpace = [];
      for (let i = 0; i < _distinctPlaces.length; i++) {

        _distinctPlacesNoSpace.push(_distinctPlaces[i].replace(/ /g, '').toLowerCase());
      }

      // retrive the places that are on foods colection and not at places collection
      // need to add 
      var _needToAdd = _distinctPlacesNoSpace.filter(function (n) {
        return !this.has(n)
      }, new Set(placesName));

      // retrive the places that are on foods colection and not at places collection
      // need to delete
      var _needToDelete = placesName.filter(function (n) {
        return !this.has(n)
      }, new Set(_distinctPlacesNoSpace));

      res.render('list_places', {
        places: _places,
        needToAdd: _needToAdd,
        needToDelete: _needToDelete
      })

    });
  });

}); // END___GET LIST OF PLACES

// ___GET Delete place by Name
app.get("/placeDelete/:placeName", (req, res) => {

  sess = req.session;

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    var myquery = {
      name: req.params.placeName.replace(/ /g, '').toLowerCase()
    };
    dbo.collection("places").deleteOne(myquery, function (err, obj) {
      if (err) throw err;
      console.log("1 place document deleted");
      db.close();
    });
  });

  res.redirect('/listPlaces');

}); // END___GET Delete place by Name


//  ___POST ADD NEW PLACE 
app.post("/placeAdd", urlencodedParser, (req, res) => {

  sess = req.session;

  if (!req.body) return res.sendStatus(400)

  var maxId;

  // get max id for autogeneration
  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    dbo.collection("places").find({}, {
      id: 1
    }).sort({
      id: -1
    }).toArray(function (err, result) {
      if (err) throw err;

      db.close();
      maxId = result[0].id;
      console.log(maxId);
      maxId = Number(maxId);
      let _id = ++maxId;
      console.log(`max : ${maxId} , new : ${_id}`);
      // Add food Item
      MongoClient.connect(db_url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("foodservice");
        var foodToAdd = {
          id: _id,
          name: req.body.name.replace(/ /g, ''),
          phone: req.body.phone,
          time: req.body.time,
          lat: req.body.lat,
          long: req.body.long
        };
        dbo.collection("places").insertOne(foodToAdd, function (err, res) {
          if (err) throw err;
          console.log("1 place Item inserted");
          db.close();
        });
      });

    });
  });

  res.redirect('/listPlaces');

}) //  END___POST ADD NEW PLACE 


// CHANGE TEXT FORMAT
function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}


// creation of database

// app.get("/dbCreate", (req, res) => {
//   MongoClient.connect(db_url, function (err, db) {
//     if (err) throw err;
//     var dbo = db.db("foodservice");
//     dbo.collection("foods").insertMany(foodList, function (err, res) {
//       if (err) throw err;
//       console.log("Number of documents inserted: " + res.insertedCount);
//       db.close();
//     });
//   });
// });


// unknown function for now
// unknown function for now
// unknown function for now


// ___GET ADD PLACE TO DATABASE
app.get("/addPlaceDB", (req, res) => {

  sess = req.session;

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    var myobj = [{
      id: 1,
      name: "Authentic",
      long: 2.323232,
      lat: 32.3434,
      time: "8-16",
      phone: "0537375243",
      desc: "description of food",
      image: "//noimage"
    }];
    dbo.collection("places").insertMany(myobj, function (err, res) {
      if (err) throw err;
      console.log("Number of documents inserted: " + res.insertedCount);
      db.close();
    });
  });
}); // END___GET ADD PLACE TO DATABASE





// start client login
app.post('/login', (req, res) => {


  console.log("|||| Login ||||")
  console.log("|||| Login ||||")

  sess = req.session;

  console.log(req.body.name);
  console.log(req.body.password);

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    dbo.collection("users").find({
      username: req.body.name,
      password: req.body.password
    }).toArray(function (err, result) {
      if (err) throw err;

      sess.user = result;

      console.dir("sess.user");
      console.dir(sess.user);

      if (sess.user.length > 0) {

        switch (sess.user[0].type) {
          case 'admin':
            res.redirect('./admin_dashboard');
            break;
          case 'client':
            res.redirect('./dashboard');
            break;

          default:
            res.render('login', {
              pageTitle: 'Food Service Client Dashboard',
              message: 'Hello there!',
              user: sess.user[0]
            })
            break;
        }
      }
      db.close();
    });

  });

  console.log("|||| Login END ||||")
  console.log("|||| Login END ||||")

}); //end client login



// ___GET client produit
app.get('/client_produits', (req, res) => {

  sess = req.session;
  let foodImages = [];
  let picturesList = [];
  let _folder = "./uploads/";
  let picturesUrl = [];
  let pictureState = "";
  let _foodList;

  console.log("ncshcbwbc");
  console.log(sess.user);

  // update the foodList

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");

    // db_call
    // __db foodlist filtred by place name
    dbo.collection("foods").find({
      place: sess.user[0].place.toLowerCase()
    }).toArray(function (err, result) {
      if (err) throw err;
      _foodList = result;
      db.close();

      // get all files in List || picturesList
      fs.readdir(_folder, (err, files) => {
        files.forEach(file => {
          picturesList.push(file);
        });

        console.log("get all files in List in ./uploads");
        console.dir(picturesList);

        // _foodlist looop
        _foodList.forEach(food => {

          // _foodlist loop || filter purpuse
          picturesList.forEach(function (value, index) {
            if (value.indexOf(`${food.id}_${food.name.toLowerCase().replace(/ /g, '')}_${food.place.toLowerCase().replace(/ /g, '')}`) !== -1) {
              picturesUrl.push(value);
            }
          });

          // html js render pictureState 
          if (picturesUrl.length == 0) {
            pictureState = `<a href="http://localhost:3030/ClientuploadProductImage/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/empty"><span style='color:red;'> no photo </span> </a>`;
            // console.log("no photo");
          } else if (picturesUrl.length == 1) {

            if (picturesUrl[0].indexOf("-validated") != -1) {
              // console.log("validated");
              pictureState = `<a href="http://localhost:3030/ClientupdateProductImage/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/validated"><span style='color:green;'> validated <i class="fas fa-check"> </i> </span></a>`;
            } else {
              // console.log("Waiting Admin Confirmation");
              pictureState = `<a href="http://localhost:3030/ClientupdateProductImage/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/pending"><span style='color:orange;'> Confirmation <i class="far fa-clock"></i>  </span>   </a>     `;
            }
          }

          console.log("picturesUrl filter of picturesList");
          console.dir(picturesUrl);

          // pictureimages is array of ids and pictures
          foodImages.push({
            id: food.id,
            images: picturesUrl,
            state: pictureState
          });

          picturesUrl = [];

        });

        res.render('client_produits', {
          pageTitle: 'Listof all foods - ADMIN PANEL',
          foodList: _foodList,
          images: foodImages,
          user: sess.user
        })
      });
    });
  });

});
// END___GET client produit


// ___GET client deleteproduct
app.get('/foodDeleteClientRequest/:name', (req, res) => {

  let user_exist = false;

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    var toDelete = {
      name: req.params.name
    };
    dbo.collection("foods").deleteOne(toDelete, function (err, obj) {
      if (err) throw err;
      console.log("1 food deleted");
      db.close();
      res.redirect("/client_produits");
    });
  });

});
// END___GET client deleteproduct

// END___GET client update Product
app.get('/foodUpdateClientRequest/:name', (req, res) => {

  sess = req.session;
  let _food;

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    dbo.collection("foods").findOne({
      name: req.params.name
    }, function (err, result) {
      if (err) throw err;
      _food = result;
      db.close();
      res.render('client_produit_update', {
        pageTitle: 'Listof all foods - ADMIN PANEL',
        user: sess.user,
        food: _food
      })
    });
  });
});
// END___GET client update Product

// ___POST client update product 000
app.post('/foodUpdateClientRequest', urlencodedParser, (req, res) => {

  sess = req.session;

  let old_food = JSON.parse(req.body.hack);
  console.log("hack");
  console.dir(old_food)

  if (!req.body) return res.sendStatus(400)

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");

    let hack = old_food.name;

    // test

    // test

    console.dir(req.files);

    if (!req.files)
      return res.status(400).send('No files were uploaded.');

    if (Object.keys(req.files).length > 0) {
      // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
      let sampleFile = req.files.picture;
      let ext = sampleFile.name.split(".")[1];

      try {
        console.log(`./uploads/${old_food.id}_${old_food.name.toLowerCase().replace(/ /g, '')}_${sess.user[0].place.toLowerCase().replace(/ /g, '')}-validated.jpeg`);
        fs.unlinkSync(`./uploads/${old_food.id}_${old_food.name.toLowerCase().replace(/ /g, '')}_${sess.user[0].place.toLowerCase().replace(/ /g, '')}-validated.jpeg`);
      } catch (err) {
        console.error(err)
      }

      try {
        console.log()
        fs.unlinkSync(`./uploads/${old_food.id}_${old_food.name.toLowerCase().replace(/ /g, '')}_${sess.user[0].place.toLowerCase().replace(/ /g, '')}-validated.png`);
      } catch (err) {
        console.error(err)
      }

      try {
        // fs.unlinkSync(`./uploads/${old_food.id}_${old_food.name.toLowerCase().replace(/ /g, '')}_${user[0].place.toLowerCase().replace(/ /g, '')}-pending.png`);
        fs.unlinkSync(`./uploads/${old_food.id}_${old_food.name.toLowerCase().replace(/ /g, '')}_${sess.user[0].place.toLowerCase().replace(/ /g, '')}-validated.jpg`);
      } catch (err) {
        console.error(err)
      }

      sampleFile.mv(`./uploads/${old_food.id}_${req.body.name.toLowerCase().replace(/ /g, '')}_${sess.user[0].place.toLowerCase().replace(/ /g, '')}-pending.${ext}`, function (err) {
        if (err)
          return res.status(500).send(err);
      });
    } else {
      // todo need code for extensions
      fs.rename(`./uploads/${old_food.id}_${old_food.name.toLowerCase().replace(/ /g, '')}_${sess.user[0].place.toLowerCase().replace(/ /g, '')}-pending.jpg`, `./uploads/${old_food.id}_${req.body.name.toLowerCase().replace(/ /g, '')}_${sess.user[0].place.toLowerCase().replace(/ /g, '')}-pending.jpg`, function (err) {
        if (err) console.log('ERROR: ' + err);
      });
    }

    var myquery = {
      name: hack
    };

    var food_to_update = {
      $set: {
        name: req.body.name,
        category: req.body.category,
        price: req.body.price,
        desc: req.body.desc
      }
    };

    dbo.collection("foods").updateOne(myquery, food_to_update, function (err, res) {
      if (err) throw err;
      console.log("1 food updated by user");
    });
    db.close();


    res.redirect("/dashboard");

  });



});
// END___POST client update product




// ___GET client LOGOUT
app.get('/logout', (req, res) => {



  user = {};

  res.render('login', {
    pageTitle: 'Food Info Service Menu',
    message: 'Food Service Login Page'
  })

});
//END ___GET client produit


// ___GET client CONTACT
app.get('/client_contact', (req, res) => {

  // console.dir(user);
  sess = req.session;

  let _place;

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    var query = {
      name: sess.user[0].place
    };
    dbo.collection("places").find(query).collation({
      locale: "fr",
      strength: 1
    }).toArray(function (err, result) {
      if (err) throw err;
      // console.log(result);
      _place = result;
      console.dir(_place);
      db.close();

      res.render('client_contact', {
        pageTitle: 'Client Contact',
        message: 'Food Service Login Page',
        user: sess.user,
        place: _place[0]
      })


    });
  });


  // ___POST Clien Contact Updated
  app.post("/client_contact_update", urlencodedParser, (req, res) => {

    sess = req.session;

    if (!req.body) return res.sendStatus(400)

    MongoClient.connect(db_url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("foodservice");

      console.log("user");
      console.dir(user);


      var myquery = {
        username: sess.user[0].username
      };


      sess.user[0].email = req.body.email;
      sess.user[0].web = req.body.website;
      sess.user[0].firstname = req.body.first_name;
      sess.user[0].lastname = req.body.last_name;
      sess.user[0].phone = req.body.phone;
      sess.user[0].address = req.body.address;

      var user_to_update = {
        $set: {
          email: req.body.email,
          web: req.body.website,
          firstname: req.body.first_name,
          lastname: req.body.last_name,
          phone: req.body.phone,
          address: req.body.address
        }
      };

      dbo.collection("users").updateOne(myquery, user_to_update, function (err, res) {
        if (err) throw err;
        console.log("1 user updated");
        db.close();
      });



      res.redirect('/client_contact');

    });

  })

});
// END___POST Clien Contact Updated

// ___GET client ADD PRODUCT

app.get('/client_ajouter', (req, res) => {
  sess = req.session;
  let _place;


  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    var query = {
      name: sess.user[0].place
    };
    dbo.collection("places").find(query).toArray(function (err, result) {
      if (err) throw err;
      console.log(result);
      _place = result;
      db.close();

      res.render('client_ajouter', {
        pageTitle: 'Client Contact',
        message: 'Food Service Login Page',
        user: sess.user,
        place: _place[0]
      })

    });
  });

});

// END___GET client ADD PRODUCT


// ___GET client Dashboard
// todo needded for redirection
app.get('/dashboard', (req, res) => {

  // foods

  // validated and not validated products
  let validated = {
    yes: 0,
    no: 0
  };
  let validated_not = 0

  let contact_required = [];



  console.log("sess.user[0].place")
  console.dir(sess.user[0].place);

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    var query = {
      place: sess.user[0].place
    };
    dbo.collection("foods").find(query).toArray(function (err, result) {
      if (err) throw err;

      user_foods = result;

      user_foods.forEach(food => {
        if (food.client_validated) {
          validated.yes++;
        } else {
          validated.no++;
        }
      });

      db.close();

      for (const [key, value] of Object.entries(sess.user[0])) {
        console.log(key, value);

        if (value === "" || value === null || value === "undefined" || value === null) {
          contact_required.push(key);
        }

      }

      res.render('dashboard', {
        pageTitle: 'Food Service Client Dashboard',
        message: 'Hello there!',
        user: sess.user,
        user_foods: user_foods,
        validated: validated,
        contact_required: contact_required
      })

    });
  });


  // places

});
// END___GET client Dashboard


// ___POST Client add product
app.post("/clientFoodAdd", urlencodedParser, (req, res) => {

  sess = req.session;

  if (!req.body) return res.sendStatus(400)

  var maxId;
  let _id;

  // get max id for autogeneration
  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    dbo.collection("foods").find({}, {
      id: 1
    }).sort({
      id: -1
    }).toArray(function (err, result) {
      if (err) throw err;

      db.close();
      maxId = result[0].id;
      console.log(maxId);
      maxId = Number(maxId);
      _id = ++maxId;
      console.log(`max : ${maxId} , new : ${_id}`);


      // Add food Item
      let _name = req.body.name.toLowerCase().replace(/ /g, '');
      let _place = sess.user[0].place.toLowerCase().replace(/ /g, '');

      if (!req.files)
        return res.status(400).send('No files were uploaded.');

      if (Object.keys(req.files).length > 0) {

        console.log("entred if");


        // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
        let sampleFile = req.files.picture;
        let ext = sampleFile.name.split(".")[1];

        console.log(_name);
        console.log(_place);

        sampleFile.mv(`./uploads/${_id}_${_name.replace(/ /g, '')}_${_place}-pending.${ext}`, function (err) {
          if (err)
            return res.status(500).send(err);

        });

      }


      MongoClient.connect(db_url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("foodservice");
        var foodToAdd = {
          id: _id,
          name: req.body.name,
          place: sess.user[0].place.toLowerCase(),
          price: req.body.price,
          category: req.body.category,
          desc: req.body.desc,
          client_validated: true,
          admin_validated: false
        };

        // console.log("-------");

        // console.dir(foodToAdd);

        // console.log("-------");

        dbo.collection("foods").insertOne(foodToAdd, function (err, res) {
          if (err) throw err;
          console.log("1 Food Item inserted");
          db.close();
        });
      });


    });

    res.redirect("/dashboard");

  });

}) // END___POST Clien ADD Product

// Admin
// Admin
// Admin

// ___GET ADMIN DASHBOARD
app.get('/admin_dashboard', function (req, res) {

  sess = req.session;
  // if (global.toLowerCaseuser.length === 0) {
  //   res.redirect("/");
  // }

  let all_places = [];
  let _places = [];
  let place_foods = [];
  let hack;
  let _food;

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");

    dbo.collection("foods").find({}).toArray(function (err, result) {
      if (err) throw err;
      foodList = result;
    });

    // places
    dbo.collection("places").find({}).toArray(function (err, result) {
      if (err) throw err;

      // console.dir(result);
      all_places = result;

      all_places.forEach(place => {

        place_foods = [];

        foodList.forEach(food => {



          if (food.place.toLowerCase().trim() === place.name.toLowerCase().trim()) {
            place_foods.push(food);
          }

        });
        hack = {
          place: place,
          foods: place_foods
        }
        _places.push(hack);
      });

      // console.log(_places.length);

      res.render('admin_dashboard', {
        user: sess.user,
        data: _places
      })

    });

    db.close();

  });

}); // ___GET ADMIN DASHBOARD

// ___GET ADMIN contact
app.get('/admin_contact', function (req, res) {

  sess = req.session;

  res.render('admin_contact', {
    user: sess.user[0]
  })
}); // END___GET ADMIN contact

// ___GET ADMIN clients
app.get('/admin_clients', function (req, res) {

  sess = req.session;

  res.render('admin_clients', {
    user: sess.user[0]
  })
}); // ___GET ADMIN clients




// ___POST ADMIN add a client
app.post('/admin_client_add', urlencodedParser, function (req, res) {

  sess = req.session;

  if (!req.body) return res.sendStatus(400)

  // test

  var maxId;

  // get max id for autogeneration
  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    dbo.collection("foods").find({}, {
      id: 1
    }).sort({
      id: -1
    }).toArray(function (err, result) {
      if (err) throw err;

      db.close();
      maxId = result[0].id;
      console.log(maxId);
      maxId = Number(maxId);
      let _id = ++maxId;
      console.log(`max : ${maxId} , new : ${_id}`);
      // Add food Item


      MongoClient.connect(db_url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("foodservice");
        var user_to_add = {
          username: req.body.client_username,
          password: req.body.client_password,
          type: "client",
          email: "unknown@unknown.unknown",
          admin: false,
          place: req.body.client_place,
          web: "www.unknown.com",
          firstname: "unknown",
          lastname: "unknown",
          hosting: false
        };

        var user_place_add = {
          name: req.body.client_place,
          phone: "0537377272",
          time: "8-23",
          lat: "lat google map",
          long: "long google map",
          desc: "Description de votre etablissement",
          validated: true,
          address: "Votre Addresse"
        };

        var user_food_add = {
          id: _id,
          name: "Burger Test",
          place: req.body.client_place.toLowerCase(),
          price: 20,
          category: "burger",
          client_validated: false,
          admin_validated: false,
          desc: "Produit de test",
          validated: false,
        };

        dbo.collection("users").insertOne(user_to_add, function (err, res) {
          if (err) throw err;
          console.log("1 user inserted");

        });

        dbo.collection("places").insertOne(user_place_add, function (err, res) {
          if (err) throw err;
          console.log("1 user place inserted");

        });

        dbo.collection("foods").insertOne(user_food_add, function (err, res) {
          if (err) throw err;
          console.log("1 user food inserted");

        });

        db.close();
      });

      // 
    });

    res.redirect('/admin_clients');

  });










}); // ___POST ADMIN add a clients


// ___GET Admin Manage Specific client
app.get('/admin/company/list/:place', function (req, res) {

  sess = req.session;

  let foodImages = [];
  let picturesList = [];
  let _folder = "./uploads/";
  let picturesUrl = [];
  let pictureState = "";
  let _foodlist;


  // update the foodList

  console.log(req.params.place)

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    dbo.collection("foods").find({
      place: req.params.place
    }).toArray(function (err, result) {
      if (err) throw err;
      _foodlist = result;
      console.dir(result)
      db.close();

      // get all files in List
      fs.readdir(_folder, (err, files) => {
        files.forEach(file => {
          picturesList.push(file);
        });
        // console.dir(picturesList);

        // for each food in the list search for images related to it
        _foodlist.forEach(food => {

          picturesList.forEach(function (value, index) {

            if (value.indexOf(`${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}`) !== -1) {

              // console.log(`${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}`);
              // console.log(value);

              picturesUrl.push(value);

              console.log(" picturesUrl value pushed " + value);
            }
          });

          // console.log(food.id)
          // console.dir(picturesUrl);

          if (picturesUrl.length == 0) {
            pictureState = `<a href="/uploadNewImage/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}"><span style='color:red;'> no photo </span> </a>`;
            // console.log("no photo");
          } else if (picturesUrl.length == 1) {

            if (picturesUrl[0].indexOf("-validated") != -1) {
              // console.log("validated");
              pictureState = `<a href="/foodValidate/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/yes"><span style='color:green;'> validated  </span></a>`;
            } else {
              // console.log("1 pending");
              pictureState = `<a href="/foodValidate/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/non"><span style='color:orange;'> 1 pending <i class="far fa-clock"></i>  </span>   </a>     `;
            }

          } else {
            // console.log(`${picturesUrl.length} pending`);
            pictureState = `<a href="/foodValidate/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/non"><span style='color:orange;'>  ${picturesUrl.length} pending <i class="far fa-clock"> </i>  </span>  </a>    `;
          }

          // pictureimages is array of ids and pictures
          foodImages.push({
            id: food.id,
            images: picturesUrl,
            state: pictureState
          });

          picturesUrl = [];

        });

        // console.log(foodImages);

        res.render('admin_client_manage', {
          pageTitle: 'Listof all foods - ADMIN PANEL',
          foodList: _foodlist,
          images: foodImages,
          user: sess.user[0]
        })

      });

    });
  });




}) // END___GET Admin Manage Specific client


// ___GET Validate A Food Object by admin
app.get("/validateFoodObject/:id/:place/:state", (req, res) => {

  sess = req.session;

  const id = parseInt(req.params.id);


  console.log(` id ${req.params.id}`);
  console.log(` place ${req.params.place}`);
  console.log(` state ${req.params.state}`);

  let place_bool;

  if (req.params.state == "false")
    place_bool = false;
  else if (req.params.state == "true")
    place_bool = true;

  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");

    var myquery = {
      id: id
    };

    var food_to_update = {
      $set: {
        admin_validated: place_bool,
      }
    };

    console.log("XXXXXXX");
    console.log("XXXXXXX");
    console.log("XXXXXXX");
    console.log("XXXXXXX");
    console.log("myquery");
    console.dir(myquery);
    console.log("user_to_update");
    console.dir(food_to_update);


    dbo.collection("foods").updateOne(myquery, food_to_update, function (err, res) {
      if (err) throw err;
      console.log("1 food Admin_validated updated by user");
    });
    db.close();


    res.redirect("/admin/company/list/" + req.params.place);

  });




}); //  END___GET Validate A Picture from PENDING IMAGES


// ___GET food by Choices by id JSON
app.get('/foodChoiceById/:id', function (req, res) {

  sess = req.session;

  const id = parseInt(req.params.id);

  console.log(id);

  // console.log(foodChoices);
  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    dbo.collection("choice").find({
      id: id
    }).toArray(function (err, result) {
      if (err) throw err;
      foodChoices = result;
      // console.log(result);
      db.close();
      res.json(foodChoices);
    });
  });

}) // END___GET food by Choices by id JSON

app.listen(3030, () => console.log('FOOD SERVICE listening on port 3030!'))