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
  dbo.createCollection("accounts", function(err, res) {
    fetch(dbo)
  });
});

var block_num = 15138
//var sleep_time = 1

async function fetch() {

    while(true) {

        await Promise.all([
            get_block(block_num)
        ]).then(function(ticker){
            //publish()
            //storage_jobs();
            block_num++
        })
        //await sleep(sleep_time)
    }

}

function get_block(bid) {

    return new Promise(function (resolve, reject) {

        dbo.collection("blocks").findOne({block_num:bid}, function(err, payload) {
            if ( payload != null ) {
                log(("block("+bid+")").green, payload.id)
                var account = check_transaction(payload)
                if ( account != null ) {
                    dbo.collection("accounts").insertOne(account, function(err, res){
                        resolve(payload)
                    })
                    return
                }

                resolve(payload)
                return
            }
        });

            
    });
}

function check_transaction(block) {
    for(var i=0; i< block.transactions.length; i++) {
        var row = block.transactions[i]
        var status = row.status
        var trxid = row.trx.id
        var actions = row.trx.transaction.actions
        for(var j=0; j < actions.length; j++) {
            var act = actions[j]
            if ( act.name == "voteproducer" ) {
                if (act.data.producers.indexOf("jedaaaaaaaaa") >= 0) {
                    var accountname = act.data.voter
                    var producers = act.data.producers
                    var block_num = row.block_num
                    var obj = {"account":accountname, "producers":producers, "block_num":block_num, "stacked":0}
                    log( accountname.green, act.data.voter.blue, act.data.producers.join() )
                    return obj
                }
            }
        }
    }
    return null;
}

let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms))
