const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Universes = require('../../Schemas/Universes.js');
const argon2 = require("argon2");
require('dotenv/config');

const warnColor = '#eb4034';
const successColor = '#00ff44';

module.exports = {
	data: new SlashCommandBuilder()
    .setName('settings')
        .setDescription('Manage game-related actions')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-universe')
                .setDescription('Adds a universe from the database')
                .addStringOption(option =>
                    option
                        .setName('server')
                        .setDescription('Your server identifier')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option
                        .setName('universeid')
                        .setDescription('Your server universe ID')
                        .setRequired(true))
    )
        
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-universe')
                .setDescription('Removes a universe from the database')
                .addStringOption(option =>
                    option
                        .setName('server')
                        .setDescription('Your server identifier')
                        .setRequired(true))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('set-keys')
            .setDescription('Sets the Messaging Service API Key')
            .addStringOption(option =>
                option
                    .setName('mongodb-uri')
                    .setDescription('Your server identifier')
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('messaging-service')
                    .setDescription('Your server identifier')
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('datastore-service')
                    .setDescription('Your server identifier')
                    .setRequired(true))
    ),
    
    run: async ({ interaction, client, handler }) => {
        const subcommand = interaction.options.getSubcommand();
        const server = interaction.options.getString('server');
        const value = interaction.options.getInteger('universeid');
        
        const dbUrl = interaction.options.getString('mongodb-uri');
        const msKey = interaction.options.getString('messaging-service');
        const dsKey = interaction.options.getString('datastore-service');

        await interaction.deferReply();

        const isKeyReserved = await Universes.getUniverse(server);
        if (subcommand === 'add-universe') {
            const reservedEmbed = new EmbedBuilder()
                .setTitle('❌ Key Reserved')
                .setDescription(`**${server}** already exists!`)
                .setColor(warnColor)
            if (isKeyReserved) return interaction.editReply({ embeds: [reservedEmbed] });
    
            const result = await Universes.addUniverse(server, value);
    
            const successEmbed = new EmbedBuilder()
                .setTitle(`${result ? '✔️ Universe Saved' : '❌ Universe Save Failed'}`)
                .setDescription(`${result ? 'Successfully saved' : 'Failed to save'}: **${server}**`)
                .setColor(`${result ? successColor : warnColor}`)
    
            await interaction.editReply({ embeds: [successEmbed] });
        } else if (subcommand === 'remove-universe') {
            const noKeyEmbed = new EmbedBuilder()
                .setTitle('❌ Unknown key')
                .setDescription(`Failed to retrieve Universe: **${server}**`)
            if (!isKeyReserved) return interaction.editReply({ embeds: [noKeyEmbed] })

            const result = await Universes.removeUniverse(server);

            const successEmbed = new EmbedBuilder()
                .setTitle(`${result ? '✔️ Universe Removed' : '❌ Universe Removal Failed'}`)
                .setDescription(`${result ? 'Successfully removed' : 'Failed to remove'}: **${server}**`)
                .setColor(`${result ? successColor : warnColor}`)
    
            await interaction.editReply({ embeds: [successEmbed] });
        } else if (subcommand === 'set-keys') {
            // delete previous guild key data from db
            // deleteOne({ guildId: guild.id });

            const salt = Buffer.from(process.env.serverSalt);
            const mongoKey = await argon2.hash(dbUrl, { salt: salt });
            const msApiKey = await argon2.hash(msKey, { salt: salt });
            const datastoreApiKey = await argon2.hash(dsKey, { salt: salt });

            // store collection of secrets
            await keySchema.create({
                messagingServiceKey: msApiKey,
                datastoreServiceKey: datastoreApiKey,
                mongoDbUrl: mongoKey,
                guildId: interaction.guildId
            });

            const savedEmbed = new EmbedBuilder()
                .setTitle('✔️ API Keys Saved Successfully')
                .addFields(
                    { name: 'REMINDER:', value: 'Never share your API keys with anyone! Doing so may completely expose your linked experience.', inline: false }
                )
                .setColor(successColor)
            
            await interaction.editReply({ embeds: [savedEmbed] })
        };
    }
}