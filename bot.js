const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { CommandKit } = require('commandkit')
const mongoose = require('mongoose');
require('dotenv/config');

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

new CommandKit({
	client,
	commandsPath: `${__dirname}/Src/SlashCommands`,
	eventsPath: `${__dirname}/Src/Events`,
	devGuildIds: ['1075940847440379975'],
	devUserIds: ['836773043014860810'],
	bulkRegister: true
});

mongoose.connect(process.env.MONGODB_URI).then(() => {
	console.log("Database connected");

	client.login(process.env.BOT_TOKEN);
});