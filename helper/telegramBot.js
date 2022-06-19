require('dotenv').config()
const axios = require("axios")

// telegram chat ids
// fini 788066174   oskar 270034072   hanna     1243440750      daniel 1442631291

module.exports = {
    execute() {
        console.log("telegram would send a message")
    },
    sendNewVideoMessage(chat_id, video){

        let message = `New Video by ${video.channel}\n${video.title} \n\n https://youtube.com/watch?v=${video.videoId}`
        
        axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            params: {
            chat_id: process.env[chat_id],
            text: message,
            },
        })
        .then(res => {
            console.log("[TELEGRAM]: /sendMessage api call success")
        })
        .catch(e => {
            console.log(`[TELEGRAM]: Error ${e.toString()}`)
        })
    },
    sendMessage(chat_id, message){
        axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            params: {
            chat_id: process.env[chat_id],
            text: message,
            },
        })
        .then(res => {
            console.log("[TELEGRAM]: /sendMessage api call success")
        })
        .catch(e => {
            console.log(`[TELEGRAM]: Error ${e.toString()}`)
        })
    }
};