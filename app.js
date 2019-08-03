const PORT = process.env.PORT || 3000;
var express = require("express");
var cors = require('cors');
var app = express();    
var path = require('path');
var router = express.Router();
var THREE = require('three');
var busboy = require('connect-busboy');
var fs = require('fs-extra');

app.use(cors());
app.use(express.static(__dirname));
app.use(busboy());
app.set('views', __dirname );
app.set('view engine', 'jade')

app.get("/upload", function(req, res){
  res.render('upload');
});

app.post("/upload", function(req, res){
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function(fieldname, file, filename){
    console.log("Uploading: " + filename);
    fstream = fs.createWriteStream(__dirname + "/models/" + filename);
    file.pipe(fstream);
  });
  res.send('Successfully Uploaded');
});

app.get("/:id", function(req, res) {
    pathToModel = `./models/${req.params.id}`;
    res.render('index', {pathToModel: pathToModel});
  });




// app.get('/:id', (req, res, next) =>{
//     pathToModel = `./models/${req.params.id}.obj`;
//     res.sendFile(path.join(__dirname, 'index.jade'), {pt: pathToModel});
//     // demo.changePath(pathToModel);
    
// });

app.listen(PORT, function() {
    console.log(`Listening on Port ${PORT}`);
  });