require('dotenv').config()
const axios = require("axios")
const fs = require("fs")
const HTMLParser = require('node-html-parser');

const telegramBot = require("./telegramBot")

const computedVideos = require("../data/cron/computedVideos.json")

const DATA_PATH = "./data/youtube/"

module.exports = {
    execute:function() {
        console.log("Youtube Abo Feed execute")
        if(process.env.DEV_MODE == "DEV"){
            console.log("[DEV MODE]: Wont scrap abo feed to prevent soft ban")
        }else{
            this.scrapAboFeed()
        }

        // TODO request custom api whcih channels should be listened to
        let channelNames = ["Nivarias", "ilmango"]
        let myFeed = JSON.parse(fs.readFileSync(DATA_PATH + "myFeedParsed.json"))

        Object.values(myFeed)[0].forEach(video => {
            if(channelNames.includes(video.channel)){
                console.log(`Found video by "${video.channel}"`)
                if(!computedVideos.includes(video.videoId)){
                    console.log(`Found new video (${video.videoId}) by "${video.channel}"`)
                    computedVideos.push(video.videoId)
                    fs.writeFileSync("./data/cron/computedVideos.json",JSON.stringify(computedVideos))
                    
                    telegramBot.sendNewVideoMessage("270034072", video)
                }
            }
        })

    },
    scrapAboFeed: function() {
        axios("https://www.youtube.com/feed/subscriptions", {
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
        }).then(res => {
            console.log(`Youtube Abo feed scrap Success status: ${res.status}`)
            let root = HTMLParser.parse(res.data);
            let data = [...root.querySelectorAll("script")].filter(elm => elm.innerText.includes("var ytInitialData"))
            let hehe = data[0].text.replace("var ytInitialData = ","").replace("};","}")
            let content = JSON.parse(hehe)
            //get video list renderer ist in heute gestern usw aufgeteilt
            content = content.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents
            let o = {}
            content.forEach(section => {
                if(section.itemSectionRenderer){
                    let name = section.itemSectionRenderer.contents[0].shelfRenderer.title.runs[0].text
                    let videos = section.itemSectionRenderer.contents[0].shelfRenderer.content.gridRenderer.items
                    videos = videos.map(video => video.gridVideoRenderer).map(function(video){
                        try{
                            // when video already wathced the first elemnt of thumbnailOverlay array was the percanteage so  i need to filter specific renderer object which cotnains time
                            let playTime = video.thumbnailOverlays.filter(elm => Object.keys(elm).includes("thumbnailOverlayTimeStatusRenderer"))[0].thumbnailOverlayTimeStatusRenderer.text.simpleText
                            
                            return {
                                videoId: video.videoId,
                                thumbnail: video.thumbnail.thumbnails[0].url.split("?")[0],
                                title: video.title.runs[0].text,
                                title_detail: video.title.accessibility.accessibilityData.label.HTMLParser,
                                publishedTime: video.publishedTimeText.simpleText,
                                playTime: playTime,
                                viewCount: video.viewCountText.simpleText,
                                channel: video.shortBylineText.runs[0].text,
                                channelDetail: {
                                    name: video.shortBylineText.runs[0].text,
                                    id: video.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId,
                                    link: video.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl,
                                    rssFeed: `https://www.youtube.com/feeds/videos.xml?channel_id=${video.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId}`
                                }
                            }
                        }catch(e){
                            console.log(e)
                            return {
                                title_detail: "PARSE ERROR SOME PATHS WHERENT FOUND",
                                error_msg: e.toString(),
                                videoId: video.videoId,
                                title: video.title.runs[0].text
                            }
                        }
                            
                    })
                    o[name] = videos
                }
            });

            fs.writeFileSync(DATA_PATH + "myFeedParsed.json", JSON.stringify(o, null, 4))
            fs.writeFileSync(DATA_PATH + "myFeed.json", JSON.stringify(content, null, 4))
        }).catch(e => {
            console.log(e)
        })
    }
}