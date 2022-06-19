# youtube_cron
- this is a small project which uses the youtube channel rss feeds to fetch videos from channels and send new uploads to different App

- supported apps atm: telegram, discord(webhooks)

- Each youtube channel has an own rss feed with his videos 

> https://www.youtube.com/feeds/videos.xml?channel_id=<channel_id>

- to get the channel id visit the channel site and inspect sourcecode and search for "channel_id"
- to automate this i also implemented a function which opens the channel sites and extract the id from the channel
    - to make this work u need to copy all your cookies from your browser (when on youtube website) to make the request work

## How to use
- clone repo
> npm i
- copy .env-template and spcify your tokens
- rename .env-template to .env
- map different channels to your whishes in ./data/cron/watchedChannels.json config file
- specify cron run schedule in app.js
> node app.js

## Workflow
- cron job runs youtubeChannel.exectue() every 15 minutes
- requests all rss feeds for listed channels
    - remaps .xml to .json
        - also stores .json file
        - WIP API which deliver this channel json data
- checks if new video is found
- when new video found send to specified APPS new Video message

## Future plans
- add api which allows users to add and remove channels to there account/channel
- add api which delvier youtube channel parsed .json files
