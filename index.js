import {Client, GatewayIntentBits} from "discord.js";
import dotenv from "dotenv";

import { AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel,getVoiceConnection } from "@discordjs/voice";

dotenv.config();

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates]});
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

let connection = null;

const player = createAudioPlayer();
let playlist = ["./soviet.mp3","./privyet_quint.m4a"];

function resetQueue() {
    playlist = ["./soviet.mp3","./privyet_quint.m4a"];
}

function getNextSong() {
    setInterval(() => { resetQueue() }, 3e6);
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
    
    if (newState.id == 218489168873914368 && newState.channelId !== null && playlist.length > 0) {
        try{
            const connection = await connectVC(newState.channel);
            connection.subscribe(player);
            playAudio(getNextSong());
        }
        catch (error) {
            console.error(error);
        }
    }
});

player.on(AudioPlayerStatus.Idle, () => {
    let next = getNextSong();
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