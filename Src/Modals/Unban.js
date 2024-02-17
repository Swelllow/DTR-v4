const { ButtonKit, createSignal, createEffect, ModalBuilder, TextInputBuilder, TextInputStyle } = require('commandkit');
const { ButtonStyle, ActionRowBuilder } = require('discord.js');

async function displayModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('appealModal')
        .setTitle('Unban Appeal Application')

    const serverInputField = new TextInputBuilder()
        .setCustomId('serverInput')
        .setLabel("Place ID you're banned from")
        .setPlaceholder('4917838193')
        .setStyle(TextInputStyle.Short);

    const userInputField = new TextInputBuilder()
        .setCustomId('userInput')
        .setLabel("What's your Username/ID?")
        .setPlaceholder('corehimself')
        .setStyle(TextInputStyle.Short);

    const appealInputField = new TextInputBuilder()
        .setCustomId('appealField')
        .setLabel("What would you like to appeal?")
        .setPlaceholder('I would like to appeal my ban because...')
        .setStyle(TextInputStyle.Paragraph);

    const firstAct = new ActionRowBuilder().addComponents(serverInputField);
    const secAct = new ActionRowBuilder().addComponents(userInputField);
    const thirdAct = new ActionRowBuilder().addComponents(appealInputField);

    modal.addComponents(firstAct, secAct, thirdAct);

    await interaction.showModal(modal);
};

module.exports = {
    name: 'unbanModal',
    run: async ({ interaction }) => { 
        const submitAppealButton = new ButtonKit()
            .setCustomId('submitAppeal')
            .setLabel('✅ Unban Appeal')
            .setStyle(ButtonStyle.Secondary)

        const buttonRow = new ActionRowBuilder().addComponents(submitAppealButton);
        const message = await interaction.editReply({
            components: [buttonRow],
            fetchReply: true
        });

        // channel.send message

        submitAppealButton.onClick(
            async (buttonInteraction) => {
                await displayModal(interaction);
            }
        )
    }
};