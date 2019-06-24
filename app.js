const PORT = process.env.PORT || 3000;
var express = require("express");
var app = express();    
var path = require('path');
var router = express.Router();
var THREE = require('three');

app.use(express.static(__dirname));

app.get('/', (req, res) =>{
    res.send("PIDR")
});


app.listen(PORT, function() {
    console.log(`Listening on Port ${PORT}`);
  });