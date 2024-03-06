import {Client, GatewayIntentBits} from "discord.js";
import dotenv from "dotenv";

import { AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel,getVoiceConnection } from "@discordjs/voice";

dotenv.config();

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates]});
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

const plMap = new Map([
    ["mattie", ["./mattie.m4a"]],
    ["me", []],
    ["quint",  ["./soviet.mp3","./privyet_quint.m4a"]],
    ["dimi", []]
]);

const idmap = new Map([
    ["218489168873914368", "mattie"],
    ["231815279506620417", "me"],
    ["220514388396867585", "quint"],
    ["243807709055418368", "dimi"]
    ]);

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
    // console.log(idmap, idmap.has(newState.id), newState.channelId !== null, newState.channelId, newState.id.toString());
    if (idmap.has(newState.id.toString()) && newState.channelId !== null && elapsed && plMap.get(idmap.get(newState.id)).length > 0){
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