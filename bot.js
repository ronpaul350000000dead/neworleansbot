const Discord = require('discord.io');
const twss = require('twss');
const catfact = require('cat-facts');
const fs = require('fs');
const Lame = require('lame');
const sleep = require('sleep').usleep;
const sanitize = require("sanitize-filename");
const path = require("path");
const mongodb = require("mongo-db").default;
const assert = require("assert");
require('dotenv').config();

const db = new mongodb(process.env.MONGO_URI, "neworleansbot", true);

const bot = new Discord.Client({
    token: process.env.TOKEN,
    autorun: true
});

let voiceChannelID = null;

/***** CONFIGURATION START *****/

const BotOwner = 'New Orleans Man';
const BotCommandPrefix = ',/';

/***** CONFIGURATION END *****/

bot.on('ready', () => {
    console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

bot.on('message', (user, userID, channelID, message, event) => {
    /**
     * Helper method to send a response.
     */
    let say = (msg) => {
        bot.sendMessage({
            to: channelID,
            message: msg
        });
    };

    /**
     * Helper method to play a sound file:
     */
    let play = (file) => {
        setVoiceChannel();

        if (!voiceChannelID) {
            say("Join a voice channel first, nimrod!");
        } else {
            bot.joinVoiceChannel(voiceChannelID, (err, events) => {
                sleep(100);

                bot.getAudioContext(voiceChannelID, (err, stream) => {
                    if (err) {
                        console.error(err);
                    }

                    let lame = new Lame.Decoder();
                    let input = fs.createReadStream("sounds/" + file + ".mp3");

                    lame.once("readable", () => {
                        stream.send(lame);
                    });

                    input.pipe(lame);
                });

            });
        }
    };

    /**
     * Helper method to find the voice channel the user is on:
     */
    let setVoiceChannel = () => {
        for (let i in bot.servers) {
            for (let j in bot.servers[i].members) {
                if (j === userID) {
                    if (bot.servers[i].members[j].voice_channel_id !== 'undefined') {
                        voiceChannelID = bot.servers[i].members[j].voice_channel_id;
                    }
                }
            }
        }
    };


    /**
     * Never respond to anything the bot itself says.
     */
    if (user === bot.username) return;


    /**
     * Actions based on if someone said anything:
     */
    /*
    if (user === 'New Orleans Man') {
        say('http://i0.kym-cdn.com/entries/icons/original/000/001/030/DButt.jpg');
    }
    */


    /**
     * Actions based on random words said, without a command:
     */
    if (!message.startsWith(BotCommandPrefix)) {
        // Double entendre detection/That's What She Said (only if more than 4
        // words were typed to reduce false positives):
        if (message.split(' ').length >= 3 && twss.is(message)) {
            say("THAT'S WHAT SHE SAID!");
        } else {
            // Only listen for "muhdick" from the bot owner:
            if (user === BotOwner && message.includes('muhdick')) {
                say('HEYO!');
            }
        }
    }


    /**
     * Commands; things that start with the command prefix:
     */
    if (message.startsWith(BotCommandPrefix)) {
        let args = message.substring(BotCommandPrefix.length).split(' ');
        let command = args[0];
        args = args.splice(1);

        switch (command) {

            /**
             * Display a random cat fact:
             */
            case 'fact':
                say(`Here's a cat fact! ${catfact.random()}`);
                break;

            /**
             * Add a quote to the database:
             */
            case 'add':
                let id = args[0];
                let quote = args.splice(1);

                db.findOne({
                    [args[0]]: {
                        $exists : true
                    }
                }).then((result) => {
                    assert.notEqual(null, result);
                    db.update(result, {
                        [id]: quote
                    }).then(() => {
                        say(`Updated quote ${id}.`);
                    });
                }).catch((err) => {
                    db.insert({
                        [id]: quote
                    }).then(() => {
                        say(`Saved quote ${id}.`);
                    });
                });
                break;

            /**
             * Display a random saved quote:
             */
            case 'random':
                db.find().then((result) => {
                    let randomQuote = result[Math.floor(Math.random() * result.length)];
                    delete randomQuote['_id'];
                    for (let prop in randomQuote) {
                        say(`Quote ${prop}: ${randomQuote[prop].join(' ')}`);
                    }
                });
                break;

            /**
             * Get a saved quote by the number:
             */
            case 'get':
                db.findOne({
                    [args[0]]: {
                        $exists : true
                    }
                }).then((result) => {
                    say(`Quote ${args[0]}: ${result[args[0]].join(' ')}`);
                }).catch((err) => {
                    say(`That quote doesn't exist ya fuck!`);
                });
                break;

            /**
             * Show some dickbutt:
             */
            case 'dickbutt':
                say('http://i0.kym-cdn.com/entries/icons/original/000/001/030/DButt.jpg');
                break;

            /**
             * Play a sound to the current users voice channel:
             */
            case 'play':
                if (fs.existsSync("sounds/" + sanitize(args[0]) + '.mp3')) {
                    play(sanitize(args[0]));
                } else {
                    say("Couldn't find that sound file?!");
                }
                break;

            /**
             * Get a list of available sound files to play:
             */
            case 'sounds':
                fs.readdir("sounds/", (err, files) => {
                    files = files.map((file) => {
                        return path.parse(file).name;
                    });

                    if (files.length) {
                        say("Here are the sound files I can play:");
                        say(files.join("\t"));
                    } else {
                        say("I don't know any sweet sound bytes to play yet :(");
                    }
                });
                break;
        }
    }
});
