require('dotenv').config()
var CronJob = require('cron').CronJob;
const fs = require('fs');

const aboFeed = require("./helper/youtubeFeed")
const channelFeed = require("./helper/youtubeChannel")

// extend console.log to write in log file
//https://javascript.plainenglish.io/lets-extend-console-log-8641bda035c3
var log = console.log;
console.log = function(){
    // 1. Convert args to a normal array
    var args = Array.from(arguments);
    //2. custom code
    let fileArgs = JSON.parse(JSON.stringify(args))
    fileArgs.unshift(`[${new Date().toLocaleString()}]`)
    fs.appendFileSync("./log/main.log", fileArgs.join(" | ") + "\n")   
    // 3. Pass along arguments to console.log
    log.apply(console, args);
}

var youtubeChannelFeed = new CronJob(
	// '*/15 * * * * *',
	'0 0/15 * 1/1 * *',
	async function() {
        await channelFeed.execute()
        afterExecute(this)
    },
	null,
	true,
	'Europe/Berlin'
);

function afterExecute(e){
    console.log(`[JOB SCHEDULE] youtubeChannelFeed: ${e.nextDate().toString()}`)
}

console.log(`---------------Startup at ${new Date().toLocaleString()}---------------`)
// git test

if(process.env.DEV_MODE != "DEV"){
    channelFeed.whoListensToWho()
}

console.log(`[JOB SCHEDULE] youtubeChannelFeed: ${youtubeChannelFeed.nextDate().toString()}`)