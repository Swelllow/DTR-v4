const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, createFieldEmbed, handleReactionAsync, millisToMinutesAndSeconds, msToTimeFormat, retrievePlayerThumbnail, timeMap, validatePlayer } = require('../../Utils/helper.js');
const { publish_message, set_entry } = require('../../Utils/API.js');
require('dotenv').config()

const banSchema = require('../../Schemas/Ban.js');
const universeSchema = require('../../Schemas/Universes.js');
const secretSchema = require('../../Schemas/Secrets.js');

const warnColor = '#eb4034';
const successColor = '#00ff44';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Manage game-related actions')
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('Warn a player in the game')
                .addStringOption(option =>
                    option
                        .setName('server')
                        .setDescription('The name of the Server to ban the user from')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option
                        .setName('player')
                        .setDescription('The player to warn')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for warning the player')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a player from the game')
                .addStringOption(option =>
                    option
                        .setName('server')
                        .setDescription('The name of the Server to ban the user from')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option
                        .setName('player')
                        .setDescription('Kick user by Username or User ID')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for kicking the player')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a player from the game')
                .addStringOption(option =>
                    option
                        .setName('server')
                        .setDescription('The name of the Server to ban the user from')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option
                        .setName('player')
                        .setDescription('The player to ban')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for banning the player')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('length')
                        .setDescription('Length of time to ban the user for')
                        .setRequired(true)
                        .addChoices(
                            { name: '1 Hour', value: '1hr' },
                            { name: '6 Hours', value: '6hr' },
                            { name: '12 Hours', value: '12hr' },
                            { name: '1 Day', value: '1day' },
                            { name: '3 Days', value: '3day' },
                            { name: '1 Week', value: '1wk' },
                            { name: '2 Weeks', value: '2wk' },
                            { name: '1 Month', value: '1mo' },
                            { name: '3 Months', value: '3mo' },
                            { name: '6 Months', value: '6mo' },
                            { name: '1 Year', value: '1yr' },
                            { name: 'Permanent', value: 'permanent' },
                        ))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unban')
                .setDescription('Unban a player from the game')
                .addStringOption(option =>
                    option.setName('server')
                        .setDescription('The name of the Server to ban the user from')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('player')
                        .setDescription('The player to unban')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('shutdown')
                .setDescription('Shutdown an entire Universe')
                .addStringOption(option =>
                    option.setName('server')
                        .setDescription('The name of the Server to shutdown')
                        .setRequired(true)
                        .setAutocomplete(true))
        ),
    run: async ({ interaction, client, handler }) => {
        const subcommand = interaction.options.getSubcommand();
        const server = interaction.options.getString('server');
        const player = interaction.options.getString('player');
        const reason = interaction.options.getString('reason');
        const length = interaction.options.getString('length');

        await interaction.deferReply();

        if (subcommand === 'kick') {
            const foundPlayer = await validatePlayer(player);
            if (foundPlayer.id) {
                const playerThumbnail = await retrievePlayerThumbnail(foundPlayer.id);
                const confirmPlayer = createEmbed('⚠️ Confirm Kick', `Are you sure you want to kick **${foundPlayer.name}**?\n\nReason: **${reason}**`, warnColor, playerThumbnail);

                const message = await interaction.editReply({ embeds: [confirmPlayer], fetchReply: true });
                await message.react('👍');
                await message.react('👎');

                handleReactionAsync(interaction, message)
                    .then(async ({ _reaction, _user, state }) => {
                        // console.log(`${user.username} reacted with ${reaction.emoji.name}`);
                        if (state === true) {
                            try {
                                let payload = JSON.stringify({
                                    userId: foundPlayer.id,
                                    reason: reason
                                });
                                const response = await publish_message(server, payload);
                                const responseColor = response.success ? successColor : warnColor;

                                let fields = [
                                    { name: 'Username', value: `${foundPlayer.name}` },
                                    { name: 'User ID', value: `${foundPlayer.id}` },
                                ];
                                const responseEmbed = createFieldEmbed(`${response ? '✔️ Kick Successful' : '❌ Kick Failed'}`, fields, responseColor, playerThumbnail);

                                await interaction.editReply({ embeds: [responseEmbed] });
                            } catch (err) {
                                return console.error(`messagingService | ${err}`);
                            }
                        } else {
                            const fields = [
                                { name: 'Kick Cancelled', value: 'Cancelled the kick process' }
                            ];
                            const cancelEmbed = createFieldEmbed('❌ Discord <-> Roblox System', fields, warnColor);
                            await interaction.editReply({ embeds: [cancelEmbed] });
                        };
                    })
                    .catch(err => console.error(err));

                // handleReaction(interaction, message, async (_reaction, _user, state) => {  
                // });
            } else {
                await interaction.editReply(`Could not find the user: ${player}`);
            };
        } else if (subcommand === 'ban') {
            const foundPlayer = await validatePlayer(player);
            if (foundPlayer.id) {
                const playerThumbnail = await retrievePlayerThumbnail(foundPlayer.id);

                const isPlayerBanned = await banSchema.findOne({ userId: foundPlayer.id }).exec();
                if (isPlayerBanned) {
                    const playerBanned = createEmbed('⚠️ Player Already Banned', `The user ${foundPlayer} is already banned from the server!`);
                    return interaction.editReply({ embeds: [playerBanned] });
                };

                const confirmPlayer = createEmbed('⚠️ Confirm Ban', `Are you sure you want to ban **${foundPlayer.name}**?\n\nTime:\n**${length}**\n\nReason:\n**${reason}**`, warnColor, playerThumbnail);

                const message = await interaction.editReply({ embeds: [confirmPlayer], fetchReply: true });
                await message.react('👍');
                await message.react('👎');

                handleReactionAsync(interaction, message)
                    .then(async ({ _reaction, _user, state }) => {
                        if (state === true) {
                            const currentTime = Date.now();
                            const configuredTime = timeMap[length];
                            const expirationTime = currentTime + configuredTime;


                            const configuredExpired = msToTimeFormat(expirationTime);

                            const entryKey = `user_${foundPlayer.id}`;
                            const payload = JSON.stringify({
                                user: foundPlayer.id,
                                reason: reason,
                                duration: configuredTime, // in ms
                                expires: configuredExpired
                            });

                            // ban in datastore \\
                            const datastoreSecret = await secretSchema.getKey('datastoreServiceKey', interaction.guildId);
                            if (!datastoreSecret) {
                                // key not configured
                            };
                            const { state, info } = await set_entry(datastoreSecret, server, 'DTR', entryKey, payload);

                            // kick using messagingService \\

                            // ban in database \\

                            // await banSchema.create({
                            //     userId: foundPlayer.id,
                            //     reason: reason,
                            //     duration: configuredTime,
                            //     expires: configuredExpired
                            // });
                            const responseColor = state ? successColor : warnColor;
                            let fields = [
                                { name: 'Username', value: `> ${foundPlayer.name}` },
                                { name: 'User ID', value: `> ${foundPlayer.id}` },
                                { name: 'Reason', value: `> ${reason}` },
                                { name: 'Duration', value: `> ${millisToMinutesAndSeconds(configuredTime)}` },
                                { name: 'Expiration', value: `> ${configuredExpired}` },
                                { name: '\u200B', value: '\u200B' },
                                { name: 'Response', value: `${info}` },
                            ];
                            const responseEmbed = createFieldEmbed(`${state ? '✔️ Ban Successful' : '❌ Ban Failed'}`, fields, responseColor, playerThumbnail);
                            await interaction.editReply({ embeds: [responseEmbed], fetchReply: true });
                        } else {

                            const fields = [
                                { name: 'Ban Cancelled', value: 'Cancelled the ban process' }
                            ];
                            const cancelEmbed = createFieldEmbed('❌ Discord <-> Roblox System', fields, warnColor);
                            await interaction.editReply({ embeds: [cancelEmbed] });
                        }
                    })
                    .catch(err => console.error(err));
            };
        } else if (subcommand === 'unban') {
            const foundPlayer = await validatePlayer(player);
            if (foundPlayer.id) {
                const playerThumbnail = await retrievePlayerThumbnail(foundPlayer.id);
                const confirmPlayer = createEmbed('⚠️ Confirm Unban', `Are you sure you want to unban **${foundPlayer.name}**?\n\nReason:\n**${reason}**`, warnColor, playerThumbnail);

                const message = await interaction.editReply({ embeds: [confirmPlayer], fetchReply: true });
                await message.react('👍');
                await message.react('👎');

                handleReactionAsync(interaction, message)
                    .then(async ({ _reaction, _user, state }) => {
                        if (state === true) {

                        } else {
                            let fields = [
                                { name: 'Unban Cancelled', value: 'Cancelled the unban process' }
                            ];
                            const cancelEmbed = createFieldEmbed('❌ Discord <-> Roblox System', fields, warnColor);
                            await interaction.editReply({ embeds: [cancelEmbed] });
                        }
                    })
                    .catch(err => console.error(err));
            };
        } else if (subcommand === 'warn') {
            const foundPlayer = await validatePlayer(player);
            if (foundPlayer.id) {
                const playerThumbnail = await retrievePlayerThumbnail(foundPlayer.id);
                const confirmPlayer = createEmbed('⚠️ Confirm Warn', `Are you sure you want to warn **${foundPlayer.name}**?\n\nReason:\n**${reason}**`, warnColor, playerThumbnail);

                const message = await interaction.editReply({ embeds: [confirmPlayer], fetchReply: true });
                await message.react('👍');
                await message.react('👎');

                handleReactionAsync(interaction, message)
                    .then(async ({ _reaction, _user, state }) => {
                        if (state === true) {

                        } else {
                            let fields = [
                                { name: 'Warn Cancelled', value: 'Cancelled the warn process' }
                            ];
                            const cancelEmbed = createFieldEmbed('❌ Discord <-> Roblox System', fields, warnColor);
                            await interaction.editReply({ embeds: [cancelEmbed] });
                        }
                    })
                    .catch(err => console.error(err));
            };
        };
    },

    autocomplete: async ({ interaction, client, handler }) => {
        const focusedValue = interaction.options.getString('server'); // || .options.getFocused();
        const choices = await universeSchema.listUniverses();

        const filtered = choices.filter((choice) => {
            if (typeof focusedValue === 'string') {
                return choice.name.toLowerCase().startsWith(focusedValue.toLowerCase());
            }
            return false;
        });

        await interaction.respond(filtered.map((choice) => ({
            name: choice.name,
            value: choice.id
        })));
    }
};