const express = require('express')
const app = express()
var fs = require("fs");
const fileUpload = require('express-fileupload');

var path = require("path");
var multiparty = require('multiparty');

var _ = require('underscore-node');

var bodyParser = require('body-parser')


var FormData = require('form-data');

var MongoClient = require('mongodb').MongoClient;
var db_url = "mongodb+srv://bouda:B0uda-bouda!@foodservice-wnasg.mongodb.net/test?retryWrites=true";
var ObjectId = require('mongodb').ObjectID;

let foodList;



// for parsing application/json

var jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
  extended: false
})


// for parsing application/x-www-form-urlencoded
app.use(fileUpload({
  limits: {
    fileSize: 50 * 1024 * 1024
  },
}));


app.use("/public", express.static('public'));
app.use("/uploads", express.static('uploads'));


MongoClient.connect(db_url, function (err, db) {
  if (err) throw err;
  var dbo = db.db("foodservice");
  dbo.collection("foods").find({}).toArray(function (err, result) {
    if (err) throw err;
    foodList = result;
    db.close();
  });
});

app.set('view engine', 'pug')


// ___GET page Home 
app.get('/', (req, res) => {

  res.render('index', {
    pageTitle: 'Food Info Service Menu',
    message: 'Hello there!'
  })


});

// ___POST upload FROM APPLICATION

app.post('/upload', function (request, response) {

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

// ___POST upload FROM ADMIN PANEL AND DELETE OTHER PENDING PHOTOS
app.post('/uploadAdmin/:foodId', function (req, res) {

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

      if (value.indexOf(url[0]) !== -1) {
        pictureUrl.push(value);
      }
    });

    // Rename the image selected for validation 

    if (!req.files)
      return res.status(400).send('No files were uploaded.');

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.picture;
    let ext = sampleFile.name.split(".")[1];

    pictureUrl.forEach((_url) => {
      fs.unlink(`./uploads/${_url}`, (err) => {
        if (err) throw err;
        console.log(`successfully deleted ./uploads/${_url}`);
        // Use the mv() method to place the file somewhere on your server
        sampleFile.mv(`./uploads/${url}-validated.${ext}`, function (err) {
          if (err)
            return res.status(500).send(err);

        });
      });

    });

    res.render('uploaded', {
      pageTitle: 'File uploaded - ADMIN PANEL'
    });

  });

});
// END___POST upload FROM ADMIN PANEL AND DELETE OTHER PENDING PHOTOS

// ___GET LIST of pictures pending and validated
app.get("/listImage", (request, response) => {

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

  var compiled = _.template(`
   `);


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

    res.render('image_validated_manage.pug', {
      pageTitle: 'MANAGE/UPDATE/DELEE VALIDATED PHOTO OF FOODS',
      pics: pictureUrl,
      pic_name: id,
      validated: validated
    })

  });

}); // END___GET MANAGE/UPDATE/DELEE VALIDATED PHOTO OF FOODS

// ___GET TABLE LIST OF ALL FOODS
app.get("/foodList", (req, res) => {

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

            if (value.indexOf(`${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}`) !== -1) {

              // console.log(`${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}`);
              // console.log(value);
              picturesUrl.push(value);

            }
          });

          // console.log(food.id)
          // console.dir(picturesUrl);

          if (picturesUrl.length == 0) {
            pictureState = `<a href="http://localhost:3030/uploadNewImage/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}"><span style='color:red;'> no photo </span> </a>`;
            // console.log("no photo");
          } else if (picturesUrl.length == 1) {

            if (picturesUrl[0].indexOf("-validated") != -1) {
              // console.log("validated");
              pictureState = `<a href="http://localhost:3030/foodValidate/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/yes"><span style='color:green;'> validated <i class="fas fa-check"> </i> </span></a>`;
            } else {
              // console.log("1 pending");
              pictureState = `<a href="http://localhost:3030/foodValidate/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/non"><span style='color:orange;'> 1 pending <i class="far fa-clock"></i>  </span>   </a>     `;
            }

          } else {
            // console.log(`${picturesUrl.length} pending`);
            pictureState = `<a href="http://localhost:3030/foodValidate/${food.id}_${food.name.replace(/ /g, '')}_${food.place.replace(/ /g, '')}/non"><span style='color:orange;'>  ${picturesUrl.length} pending <i class="far fa-clock"> </i>  </span>  </a>    `;
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

    res.render('validate_picture');

  });

}); //  ___GET Validate A Picture from PENDING IMAGES

// NON image part

// __GET all food JSON
app.get('/allFood', function (req, res) {
  res.json(foodList);
}) // END__GET all food JSON

// ___GET food by id JSON
app.get('/food/:id', function (req, res) {
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
  // todo places need to get them with query
  // let places = ["All", "mcdonalds", "Authentik", "Pizza Hut", "khalid", "Tacos de Lyon"];
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
  // todo mongodb
  const budget = req.params.budget;
  let foodListFiltred = [];

  foodList.forEach(food => {
    if (Number(food.price) <= Number(budget)) {
      foodListFiltred.push(food);
    }
  });
  res.json(foodListFiltred);
}) // END___GET food by budget JSON

// ___GET filter food by category JSON
app.get('/categoryFood/:budget/:category', function (req, res) {
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

  res.render('upload_first_img', {
    pic_name: req.params.url,
    picUrl: req.params.url
  });

}); // END___GET Upload image for food with no image -ADMING PANEL

// ___GET delete food item from list
app.get("/foodDelete/:foodId", (req, res) => {
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

  if (!req.body) return res.sendStatus(400)

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
        var foodToAdd = {
          id: _id,
          name: req.body.name,
          place: toTitleCase(req.body.place),
          price: req.body.price,
          category: req.body.category
        };
        dbo.collection("foods").insertOne(foodToAdd, function (err, res) {
          if (err) throw err;
          console.log("1 Food Item inserted");
          db.close();
        });
      });

    });
  });

  res.redirect('/foodList');

}) // END___POST ADD FOOD ITEM TO LIST

// ___GET PLACE INFO BY ID
app.get("/getPlaceInfo/:place", (req, res) => {
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


// ___GET ADD PLACE TO DATABASE
app.get("/addPlaceDB", (req, res) => {
  MongoClient.connect(db_url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("foodservice");
    var myobj = [{
      id: 1,
      name: "Authentic",
      long: 2.323232,
      lat: 32.3434,
      time: "8-16",
      phone: "0537375243"
    }];
    dbo.collection("places").insertMany(myobj, function (err, res) {
      if (err) throw err;
      console.log("Number of documents inserted: " + res.insertedCount);
      db.close();
    });
  });
}); // END___GET ADD PLACE TO DATABASE


// ___GET LIST OF PLACES
app.get("/listPlaces", (req, res) => {

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

}); // ___GET LIST OF PLACES


app.get("/placeDelete/:placeName", (req, res) => {

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

});


app.post("/placeAdd", urlencodedParser, (req, res) => {

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

})





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



function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}


app.listen(3030, () => console.log('Example app listening on port 3030!'))