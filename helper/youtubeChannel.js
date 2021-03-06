require('dotenv').config()
const axios = require("axios")
const fs = require("fs")
var convert = require('xml-js');
const HTMLParser = require('node-html-parser');


const watchedChannels = require("../data/cron/watchedChannels.json");
const telegramBot = require("./telegramBot");
const discordWebhook = require('./discordWebhook');

module.exports = {
    execute: async function (){
        console.group("[YT_CHANNEL]: execute started")
        let startTimestamp = new Date().getTime()
        for(channel_id of Object.keys(watchedChannels.links)){
            let videos = [], needsToBeUpdated = false

            Object.values(watchedChannels.app_keys[channel_id]).forEach(list => {
                if(list.length >= 1){
                    needsToBeUpdated = true
                }
            })

            if(needsToBeUpdated){
                if(process.env.DEV_MODE == "DEV"){
                    console.log("[DEV MODE]: Wont scrap abo feed to prevent soft ban")
                    try{
                        videos = JSON.parse(fs.readFileSync(`./data/youtube/channels/${channel_id}.json`))
                    }catch(e){
                        console.log("Channel wasnt scrapped ones so no dev data available")
                    }
                }else{
                    // delay for each fetch to prevent ban
                    videos = await this.getChannelFeed(channel_id)
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                let videoIdList = []
                videos.forEach(video => {
                    let uploadTimestamp = new Date(video.publishedTime).getTime()
                    if(uploadTimestamp >= watchedChannels.lastTimeChecked){
                        watchedChannels.app_keys[channel_id].telegram.forEach(chat_name => {
                            telegramBot.sendNewVideoMessage(watchedChannels.telegramChatId[chat_name], video)
                        })

                        watchedChannels.app_keys[channel_id].discordWebhook.forEach(webhook_id => {
                            discordWebhook.sendNewVideoMessage(watchedChannels.discordWebhooks[webhook_id], video)
                        })
                    }
                })
            }else{
                console.log(`[YT_CHANNEL]: Channel "${this.getChannelName(channel_id)}" skipped due to no listeners`)
            }
            
        }
        
            
        watchedChannels.lastTimeChecked = startTimestamp
        fs.writeFileSync("./data/cron/watchedChannels.json",JSON.stringify(watchedChannels, null, 4))

        console.groupEnd()
        console.log("[YT_CHANNEL]: execute finished")
    },
    getChannelName: function (channel_id){
        return watchedChannels.links[channel_id].split("/").pop()
    },
    getChannelFeed: async function(channel_id) {
        let o = []
        await axios.get(`https://www.youtube.com/feeds/videos.xml`, {
                params: {
                    channel_id: channel_id
                },
        })
        .then(res => {
            console.log(`[YT_CHANNEL]: RSS FEED  call success: channel_id ${this.getChannelName(channel_id)}`)
            let rssFeed = JSON.parse(convert.xml2json(res.data, {compact: true, spaces: 4}))
            let videos = rssFeed.feed.entry

            videos = videos.map(function (video) {
                try{
                    return {
                        videoId: video["yt:videoId"]._text,
                        thumbnail: video["media:group"]["media:thumbnail"]._attributes.url,
                        title: video.title._text,
                        title_detail: video.title._text,
                        publishedTime: video.published._text,
                        playTime: "4:20",
                        viewCount: video["media:group"]["media:community"]["media:statistics"]._attributes.views,
                        channel: video.author.name._text,
                        channelDetail: {
                            name: video.author.name._text,
                            id: video["yt:channelId"]._text,
                            link: video.author.uri._text,
                            rssFeed: `https://www.youtube.com/feeds/videos.xml?channel_id=${video["yt:channelId"]._text}`
                        }
                    }
                }catch(e){
                    console.log(e)
                    return {
                        title_detail: "PARSE ERROR SOME PATHS WHERENT FOUND",
                        error_msg: e.toString(),
                        videoId: video["yt:videoId"]._text,
                        title: video.title._text
                    }
                }
            })

            fs.writeFileSync(`./data/youtube/channels/${channel_id}.json`, JSON.stringify(videos, null, 4))
            o = videos
            
        })
        .catch(e => {
            console.log(`[YT_CHANNEL]: Error ${e.toString()}`)
            o = []
        })

        return o
    },
    getChannelId: async function(link) {
        if(!Object.values(watchedChannels.links).includes(link)){
            let o = "error"
            await axios(link, {
                "headers": {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
                    "cache-control": "no-cache",
                    "pragma": "no-cache",
                    "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"101\", \"Opera\";v=\"87\"",
                    "sec-ch-ua-arch": "\"x86\"",
                    "sec-ch-ua-bitness": "\"64\"",
                    "sec-ch-ua-full-version": "\"101.0.4951.67\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-model": "\"\"",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-ch-ua-platform-version": "\"10.0.0\"",
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "none",
                    "sec-fetch-user": "?1",
                    "service-worker-navigation-preload": "true",
                    "upgrade-insecure-requests": "1",
                    "cookie": process.env.YOUTUBE_COOKIES
                }
            })
            .then(async res => {
                console.log("[YT_CHANNEL]: getChannelId() HTML scrap success")
                let root = HTMLParser.parse(res.data);
                let rssFeedLink = [...root.querySelectorAll("link[title='RSS']")][0].rawAttributes.href
                let channelId = rssFeedLink.split("=")[1]

                watchedChannels.links[channelId] = link
                watchedChannels.app_keys[channelId] = this.generateAppKeys()
                o = channelId

                fs.writeFileSync("./data/cron/watchedChannels.json",JSON.stringify(watchedChannels, null, 4))
            })
            .catch(e => {
                console.log(`[YT_CHANNEL]: Error ${e.toString()}`)
            })

            return o
        }else{
            console.log(`[YT_CHANNEL]: Channel already scraped`)
            return watchedChannels.links[link]
        }
    },
    generateAppKeys: function() {
        return {
            telegram: [],
            discordWebhook: [],
            discordUserIds: []
        }
    },
    whoListensToWho: function() {

        //TODO merken wer wem zugeh??rt hat und nur den channelks die nachricht schicken wo es sich ge??ndert hat ansonten ist es spam

        // discord webhooks
        Object.keys(watchedChannels.discordWebhooks).forEach(webhook_name => {
            let channelNames = []
            Object.keys(watchedChannels.links).forEach(channel_id => {
                if(watchedChannels.app_keys[channel_id].discordWebhook.includes(webhook_name)){
                    channelNames.push(watchedChannels.links[channel_id].split("/")[4])
                }
            })
            console.log(`${webhook_name} is listening to ${channelNames.join(", ")}`)
            discordWebhook.sendMessage(
                watchedChannels.discordWebhooks[webhook_name],
                `Youtube Channel listener app (re)started.\n\nThis channel is listening to ${channelNames.join(", ")}.`
            )
        })

        // telegram
        Object.keys(watchedChannels.telegramChatId).forEach(chat_name => {
            let channelNames = []
            Object.keys(watchedChannels.links).forEach(channel_id => {
                if(watchedChannels.app_keys[channel_id].telegram.includes(chat_name)){
                    channelNames.push(watchedChannels.links[channel_id].split("/")[4])
                }
            })
            console.log(`${chat_name} is listening to ${channelNames.join(", ")}`)
            telegramBot.sendMessage(
                watchedChannels.telegramChatId[chat_name],
                `Youtube Channel listener app (re)started.\n\nThis channel is listening to: ${channelNames.join(", ")}.`
            )
        })
    },
    updateVideoList: async function() {
        console.log("[YT_CHANNEL]: execute started")
        for(channel_id of Object.keys(watchedChannels.links)){
            
            let videos = []
            // delay for each fetch to prevent ban
            videos = await this.getChannelFeed(channel_id)
            await new Promise(resolve => setTimeout(resolve, 2000));

            
            let videoIdList = []
            videos.forEach(video => {
                videoIdList.push(video.videoId)
            })

            //feed video ids are the only ids i need in the watchedChannel list
            // older ids get deleted from list
            // function inspired from https://stackoverflow.com/a/20690490 
            watchedChannels.videos[channel_id] = videoIdList
            fs.writeFileSync("./data/cron/watchedChannels.json",JSON.stringify(watchedChannels, null, 4))

            
        }
        console.log("[YT_CHANNEL]: execute finished")
    },
    addListenerToChannel: function(channelName, application, key) {
        let availableApplications = Object.keys(Object.values(watchedChannels.app_keys)[0])
        if(!availableApplications.includes(application)){
            throw `Application isnt available. Availables: ${availableApplications.join(", ")}`
        }

        
        // i use Object.entries return [key, vlaue]
        // .some breaks as son as first true returned => used to stop when channel found 
        // wrapped in if to throw error when no channel found due to the fact always false returned
        if(!Object.entries(watchedChannels.links).some(linkPair => {
            if(linkPair[1].includes(channelName)){
                let channel_id = linkPair[0]

                if(!watchedChannels.app_keys[channel_id][application].includes(key)){
                    watchedChannels.app_keys[channel_id][application].push(key)
                    fs.writeFileSync("./data/cron/watchedChannels.json",JSON.stringify(watchedChannels, null, 4))
                    console.log(`[YT_CHANNEL]: Success '${channelName}' is now listened at ${application}:${key}`)
                }else{
                    console.log(`[YT_CHANNEL]: Error '${channelName}' already listened by ${application}:${key}`)
                }
                return true
            }else{
                return false
            }
        })){
            throw "Channel not available"
        }

    }
}