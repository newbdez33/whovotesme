"use strict";
var request = require('superagent')
var moment = require('moment')
const log = require ('ololog').configure ({ locate: false })
const asTable   = require ('as-table')
var jsonminify = require("jsonminify");
require ('ansicolor').nice;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/blocks";

var dbo;
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    dbo = db.db("blocks");

    dbo.collection("accounts").find().sort({staked:1}).forEach( function(obj) {
        log(obj.account, obj.stacked)
    });

});
