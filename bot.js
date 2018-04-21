var Discord = require('discord.io');
var twss = require('twss');
var catfact = require('cat-facts');
var fs = require('fs');
var Lame = require('lame');
require('dotenv').config();

var bot = new Discord.Client({
    token: process.env.TOKEN,
    autorun: true
});

var quoteMemory = {};
var voiceChannelID = null;

/***** CONFIGURATION START *****/

let BotOwner = 'New Orleans Man';
let BotCommandPrefix = ',/';

/***** CONFIGURATION END *****/

bot.on('ready', function() {
    console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

bot.on('message', function(user, userID, channelID, message, event) {
    console.log(user);
        
    /**
     * Helper function to send a response.
     */
    let say = function(msg) {
        bot.sendMessage({
            to: channelID,
            message: msg
        });
    };

    /**
     * Helper function to play a sound file:
     */
    let play = function(file) {
        if (!voiceChannelID) {
            say("Maybe you should join a voice channel first?");
        } else {
            bot.getAudioContext(voiceChannelID, function(err, stream) {
                if (err) console.error(err);
/*
                fs.createReadStream("sounds/" + file).pipe(stream, { end: false });
                stream.on("done", function() {});
*/
                var lame = new Lame.Decoder();
                var input = fs.createReadStream("sounds/" + file);

                lame.once("readable", function() {
                    stream.send(lame);
                });

                input.pipe(lame);
            });
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
        // Double entendre detection/That's What She Said:
        if (twss.is(message)) {
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
                say(catfact.random());
                break;

            /**
             * Add a quote:
             */
            case 'add':
                let id = args[0];
                let quote = args.splice(1);
                quoteMemory[id] = quote.join(' ');
                say("I'll remember that.");
                break;

            /**
             * Display a random saved quote:
             */
            case 'random':
                let keys = Object.keys(quoteMemory);
                let randomQuote = quoteMemory[keys[keys.length * Math.random() << 0]];
                say(randomQuote);
                break;

            /**
             * Get a saved quote by the number:
             */
            case 'get':
                if (args[0] in quoteMemory) {
                    say(quoteMemory[args[0]]);
                } else {
                    say("That quote doesn't exist ya fuck!");
                }
                break;

            /**
             * Show some dickbutt:
             */
            case 'dickbutt':
                say('http://i0.kym-cdn.com/entries/icons/original/000/001/030/DButt.jpg');
                break;

            /**
             * Join a voice channel:
             */
            case 'join':
                if (!args.length) {
                    say("Join which voice channel??");
                } else {
                    voiceChannelID = args[0];
                    bot.joinVoiceChannel(voiceChannelID, function(err, events) {
                        if (err) {
                            say("I couldn't join the voice channel.");
                            console.error(err);
                        }
                    });
                }
                break;

            /**
             * Leave a voice channel:
             */
            case 'leave':
                bot.leaveVoiceChannel(voiceChannelID);
                voiceChannelID = null;
                break;

            /**
             * Play a fart sound on the current voice channel:
             */
            case 'fart':
                play("fart.mp3");
                break;

            /**
             * Play a rick roll on the current voice channel:
             */
            case 'rickroll':
                play("rickroll.mp3");
                break;

        }
    }
});
