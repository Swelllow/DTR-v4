const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

const timeMap = {
    '1hr': 60 * 60 * 1000,
    '6hr': 6 * 60 * 60 * 1000,
    '12hr': 12 * 60 * 60 * 1000,
    '1day': 24 * 60 * 60 * 1000,
    '3day': 3 * 24 * 60 * 60 * 1000,
    '1wk': 7 * 24 * 60 * 60 * 1000,
    '2wk': 14 * 24 * 60 * 60 * 1000,
    '1mo': 30 * 24 * 60 * 60 * 1000,
    '3mo': 3 * 30 * 24 * 60 * 60 * 1000,
    '6mo': 6 * 30 * 24 * 60 * 60 * 1000,
    '1yr': 365 * 24 * 60 * 60 * 1000,
    'permanent': null
};

function createEmbed(title, description, color, thumbnail = '') {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();

    if (thumbnail) {
        embed.setThumbnail(thumbnail);
    }

    return embed;
};

function createFieldEmbed(title, fields, color, thumbnail) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setTimestamp();

    fields.forEach(field => {
        embed.addFields(field);
    });
    
    if (thumbnail) {
        embed.setThumbnail(thumbnail);
    }

    return embed;
};

function handleReaction(interaction, messageObj, callback) {
    const collectorFilter = (reaction, user) => {
        return ['👍', '👎'].includes(reaction.emoji.name) && user.id === interaction.user.id;
    };
    const collector = messageObj.createReactionCollector({ filter: collectorFilter, max: 1, time: 60000, errors: ['time'] });
    collector.on('collect', (reaction, user) => {
        if (reaction.emoji.name === '👍') {
            callback(reaction, user, true);
        } else {
            callback(reaction, user, false);
        }
    })

    collector.on('end', collected => {
        messageObj.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
    })
};

function handleReactionAsync(interaction, messageObj) {
    return new Promise((resolve, reject) => {
        const collectorFilter = (reaction, user) => {
            return ['👍', '👎'].includes(reaction.emoji.name) && user.id === interaction.user.id;
        };
        
        const collector = messageObj.createReactionCollector({ filter: collectorFilter, max: 1, time: 60000, errors: ['time'] });
        
        collector.on('collect', (reaction, user) => {
            try {
                if (reaction.emoji.name === '👍') {
                    resolve({ reaction, user, state: true });
                } else {
                    resolve({ reaction, user, state: false });
                }
            } catch (err) {
                reject(`Error during reaction collection: ${err}`);
            };
        });

        collector.on('end', collected => {
            try {
                messageObj.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
            } catch (err) {
                reject(`Error during reaction removal: ${err}`);
            };
        });
    });
};

function msToTimeFormat(ms) {
    return moment(ms).format('MMM Do YYYY, h:mm A');
};

async function retrievePlayerThumbnail(player) {
    try {
        const response = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${player}&size=50x50&format=Png&isCircular=true`)
        const data = response.data.data[0]
        return data.imageUrl;
    } catch (err) {
        console.log(err);
        return err;
    }
};

function isNumeric(str) {
    if (typeof str != "string") return false
    return  !isNaN(str) &&
            !isNaN(parseFloat(str))
}

async function validatePlayer(playerName) {
    let baseURL = 'https://users.roblox.com/v1/usernames/users';
    if (isNumeric(playerName)) {
        baseURL = `https://api.roblox.com/users/${playerName}`;
    };

    try {
        const response = await axios.post(baseURL, {
            "usernames": [playerName],
            "excludeBannedUsers": true
        });

        const data = response.data.data[0];
        if (data.id !== undefined) {
            return {id: data.id, name: data.name};
        } else {
            return false;
        }
    } catch (err) {
        throw new Error(`Error with player validation: ${err.message}`);
    }
};

module.exports = { createEmbed, createFieldEmbed, handleReaction, handleReactionAsync, msToTimeFormat, retrievePlayerThumbnail, timeMap, validatePlayer }
