require('dotenv').config()
const axios = require("axios")


module.exports = {
    execute() {
        console.log("telegram would send a message")
    },
    sendNewVideoMessage(webhook_id, video){
        //nivarias a channel on youtube uses || but this is interpreted by discord with sensored area in message
        let title = video.title.replace(/\|\|/g,"|")

        // possible cotent https://discord.com/developers/docs/resources/channel#create-message
        let message = JSON.stringify({
            content: `**New Video by ${video.channel}**\n${title} \n\n https://youtube.com/watch?v=${video.videoId}`
        })

        
       axios.post(`https://discord.com/api/webhooks/${process.env[webhook_id]}`, message, {
            headers: {
              'Content-Type': 'application/json'
            }
          })
        .then(res => {
            console.log("[DISCORD]: webhook call success")
        })
        .catch(e => {
            console.log(`[DISCORD]: Error ${e.toString()}`)
        })
    },
    sendMessage(webhook_id, message){
        // possible cotent https://discord.com/developers/docs/resources/channel#create-message
        let msg = JSON.stringify({
            content: message
        })

        
       axios.post(`https://discord.com/api/webhooks/${process.env[webhook_id]}`, msg, {
            headers: {
              'Content-Type': 'application/json'
            }
          })
        .then(res => {
            console.log("[DISCORD]: webhook call success")
        })
        .catch(e => {
            console.log(`[DISCORD]: Error ${e.toString()}`)
        })
    }
};