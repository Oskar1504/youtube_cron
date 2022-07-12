require("dotenv").config()
const express = require('express')
const fs = require('fs')

const Log = require("./helper/Log");
const MainApiConnector = require("./helper/MainApiConnector");

const app = express()

app.use(express.json())

app.use(function (req, res, next) {
    Log.request(req.originalUrl)

    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers","Content-Type")
    res.header("'Content-Type', 'application/json'")
    next()
})

app.get('/', async function (req, res) {
    res.json({
        message: "youtube api alive",
        status: 200
    })
})

app.get('/channelList', async function (req, res) {
    
    try{
        res.json({
            data: fs.readdirSync("./data/youtube/channels/").filter(file => file.endsWith(".json")).map(file => file.split(".")[0]),
            status:200
        })

    }catch(e){
        Log.error(e.toString())
        res.json({message: e.toString(), status:500})
    }
})

app.get('/channelFeed', async function (req, res) {
    
    try{
        res.json({
            data: JSON.parse(fs.readFileSync(`./data/youtube/channels/${req.query.channelId}.json`)),
            status:200
        })

    }catch(e){
        Log.error(e.toString())
        res.json({message: `'${req.query.recipe}' recipe file does not exist. Use /channelList to get all available recipe files.`, status:500})
    }
})

app.listen(process.env.PORT, function () {
    console.log(`${process.env.PROJECT_NAME} is running at http://localhost:${process.env.PORT}`)
    MainApiConnector.addApplication(app, process.env)
})