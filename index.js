import {Client, GatewayIntentBits} from "discord.js";
import dotenv from "dotenv";

import { AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel,getVoiceConnection } from "@discordjs/voice";
// import fs from "fs";

dotenv.config();

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates]});
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

import config from "./config.json" assert { type: "json"};
const plMap = new Map(Object.entries(config["members"]));

const idmap = new Map(Object.entries(config["ids"]));

let connection = null;
let elapsed = true;

const player = createAudioPlayer();
let playlist = [];

function getNextSong(user) {
    if (user) {
        playlist = plMap.get(user).slice(); // issue where plMap is overridden for some reason
    }
    if (playlist.length === 0) return;
    elapsed = false;
    setTimeout(() => { elapsed = true }, 3e6);
    console.log(playlist);
    return playlist.pop();
}

function playAudio(songstr) {
    const resource = createAudioResource(songstr);
    player.play(resource);
    return entersState(player, AudioPlayerStatus.Playing, 5e3);
}

async function connectVC(channel) {
    connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });
    try {
        return connection;
    } catch (error) {
        connection.destroy();
        throw error;
    }
}
client.on("voiceStateUpdate", async (oldState, newState) => {
    if (idmap.has(newState.id.toString()) && newState.channelId !== null && oldState.channelId === null && elapsed && plMap.get(idmap.get(newState.id)).length > 0){
        console.log("test");
        try{
            const connection = await connectVC(newState.channel);
            connection.subscribe(player);

            playAudio(getNextSong(idmap.get(newState.id)));
        }
        catch (error) {
            console.error(error);
        }
    }
});

player.on(AudioPlayerStatus.Idle, () => {
    let next = getNextSong(null);
    if (!next) {
        connection.destroy();
        connection = null;
        player.stop();
    }
    else {
        playAudio(next);
    }
});

client.login(process.env.TOKEN);