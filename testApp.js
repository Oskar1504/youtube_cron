require('dotenv').config()
var CronJob = require('cron').CronJob;
const fs = require("fs")

const aboFeed = require("./helper/youtubeFeed")
const aboChannel = require("./helper/youtubeChannel");
const discordWebhook = require('./helper/discordWebhook');
const telegramBot = require('./helper/telegramBot');

var simulateRunningScript = new CronJob(
	'*/5 * * * * *',
	// '0 0/15 * 1/1 * *',
	async function() {
        envtest.keys.push("hallo")
        fs.writeFileSync("./data/cron/envtest.json",JSON.stringify(envtest, null, 4))
    },
	null,
	false,
	'Europe/Berlin'
);

// extend console.log to write in log file
//https://javascript.plainenglish.io/lets-extend-console-log-8641bda035c3
var log = console.log;
console.log = function(){
    // 1. Convert args to a normal array
    var args = Array.from(arguments);
    //2. custom code
    let fileArgs = JSON.parse(JSON.stringify(args))
    fileArgs.unshift(`[${new Date().toLocaleString()}]`)
    fs.appendFileSync("./log/test_main.log", fileArgs.join(" | ") + "\n")   
    // 3. Pass along arguments to console.log
    log.apply(console, args);
}
console.log(`---------------Startup at ${new Date().toLocaleString()}---------------`)

async function main(){
    console.log(await aboChannel.getChannelId("https://www.youtube.com/c/SeaofThieves"))
    console.log("nach der funktion")
}

// main()
aboChannel.updateVideoList()
//aboChannel.whoListensToWho()

//aboChannel.getChannelId("https://www.youtube.com/c/SeaofThieves")

//telegramBot.sendMessage("T_CID_OSKAR","Hallo oskar")