const PORT = process.env.PORT || 3000;
var express = require("express");
var app = express();    
var path = require('path');
var router = express.Router();
var THREE = require('three');

app.use(express.static(__dirname));
app.set('views', __dirname );
app.set('view engine', 'jade')

app.get("/:id", function(req, res) {
    pathToModel = `./models/${req.params.id}.obj`;
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