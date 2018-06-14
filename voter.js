"use strict";
var request = require('superagent')
var moment = require('moment')
const log = require ('ololog').configure ({ locate: false })
const asTable   = require ('as-table')
var jsonminify = require("jsonminify");
const exec = require("child_process").exec
require ('ansicolor').nice;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/blocks";

var dbo;
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  dbo = db.db("blocks");
  dbo.createCollection("accounts", function(err, res) {
    log("started")
    fetch(dbo)
  });
});

var block_num = 15138   //first vote here
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

        exec('/home/jacky/bp/cleos.sh get block ' + block_num , (error, stdout, stderr) => {
                var json
                try {
                    json = JSON.parse(stdout)
                } catch(e) {
                    log("up to date")
                    json = undefined
                }
                if ( json == undefined ) {
                    resolve(stdout)
                    return
                }
                log(("voter("+bid+")").green, json.id)
                var account = check_transaction(json)
                if ( account != null ) {
                    exec('/home/jacky/bp/cleos.sh get account -j ' + account.account , (errora, stdouta, stderra) => {
                        var obj
                        try {
                            obj = JSON.parse(stdouta)
                        } catch(e) {
                            log("json failed")
                            obj = undefined
                        }
                        if ( obj == undefined ) {
                            resolve(stdouta)
                            return
                        }
                        //log(("voter("+account.account+")").green, obj.voter_info)
                        account.staked = obj.voter_info.staked
                        account.update_to_date = 1
                        dbo.collection("accounts").update({"account":account.account}, account, {upsert: true, safe: false}, function(err, res){
                            log(("voter("+account.account+")").green, account.staked)
                            resolve(obj)
                            return
                        })
                    })
                }
                resolve(json)
                return
        })
            
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
                    var block_num = block.block_num
                    var obj = {"account":accountname, "producers":producers, "block_num":block_num, "stacked":0}
                    //log( accountname.green, act.data.voter.blue, act.data.producers.join() )
                    return obj
                }
            }
        }
    }
    return null;
}

let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms))
