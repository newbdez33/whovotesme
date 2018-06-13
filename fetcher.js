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
  dbo.createCollection("blocks", function(err, res) {
    fetch(dbo)
  });
});

var block_num = 415635
var sleep_time = 1

async function fetch() {

    while(true) {

        await Promise.all([
            get_block()
        ]).then(function(ticker){
            //publish()
            //storage_jobs();
        })
//        await sleep(sleep_time)
    }

}

function get_block() {
    var url = 'http://127.0.0.1:8888/v1/chain/get_block';
    return new Promise(function (resolve, reject) {

        dbo.collection("blocks").findOne({block_num:block_num}, function(err, payload) {

            if ( payload != null ) {
                check_transaction(payload)
                log (("block("+block_num+"):").yellow, payload.id);
                resolve(payload)
                return
            }
            request.post(url)
            .set('Content-Type', 'application/json')
            .send('{"block_num_or_id":'+block_num+'}')
            .then(function (payload) {
                var json
                try {
                    json = JSON.parse(payload.text)
                } catch(e) {
                    log(e)
                    json = undefined
                }
                if ( json == undefined ) {
                    resolve(payload)
                    return
                }
                dbo.collection("blocks").insertOne(json, function(err, res){
                    check_transaction(json)
block_num++;
                    log (("block("+block_num+"):").green, json.id);
                    resolve(payload)
                })
                
            });
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
                log(("block("+block_num+")").green, act.data.voter.blue, act.data.producers.join())
            }
        }
    }
}

let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms))
