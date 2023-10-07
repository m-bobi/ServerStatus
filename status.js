const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
const { bmApiKey, libServerId, token } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const serverStatusCommand = new SlashCommandBuilder()
    .setName('serverstatus')
    .setDescription('Fetches the status of the server from BattleMetrics');

let statusEmbed = new EmbedBuilder().setTitle('Server Status').setColor('#FFFF00'); // Default empty embed

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await client.application.commands.create(serverStatusCommand.toJSON());

    // Fetch server status and create the embed
    const serverInfo = `https://api.battlemetrics.com/servers/${libServerId}`;
    const serverInfoResponse = await fetch(serverInfo, {
        headers: {
            Authorization: `Bearer ${bmApiKey}`,
            'Content-Type': 'application/json',
        },
    });

    if (!serverInfoResponse.ok) {
        console.error(`${serverInfoResponse.status} - ${serverInfoResponse.statusText}`);
        return;
    }

    const { data: { attributes: { status, name, players, maxPlayers, details: { map } } } } = await serverInfoResponse.json();

    statusEmbed = new EmbedBuilder()
        .setTitle(`${name}`)
        .setColor(status === 'online' ? '#00FF00' : '#FF0000');

    statusEmbed.addFields(
        { name: 'Players', value: `\`\`\`${players}/${maxPlayers}\`\`\``, inline: true },
        { name: 'Status', value: `\`\`\`${status}\`\`\``, inline: true },
        { name: 'Map', value: `\`\`\`${map}\`\`\``, inline: true }
    );

    // Update the embed every 2 minutes
    setInterval(async () => {
        if (!statusEmbed) return;
        const serverInfoResponse = await fetch(serverInfo, {
            headers: {
                Authorization: `Bearer ${bmApiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!serverInfoResponse.ok) {
            console.error(`${serverInfoResponse.status} - ${serverInfoResponse.statusText}`);
            return;
        }

        const { data: { attributes: { players: updatedPlayers, maxPlayers: updatedMaxPlayers, status: updatedStatus, details: { map: updatedMap } } } } = await serverInfoResponse.json();

        statusEmbed
            .spliceFields(0, statusEmbed.fields.length)
            .addFields(
                { name: 'Players', value: `\`\`\`${updatedPlayers}/${updatedMaxPlayers}\`\`\``, inline: true },
                { name: 'Status', value: `\`\`\`${updatedStatus}\`\`\``, inline: true },
                { name: 'Map', value: `\`\`\`${updatedMap}\`\`\``, inline: true }
            );
    }, 2 * 60 * 1000); // 2 minutes
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'serverstatus') {
        await interaction.reply({ embeds: [statusEmbed] });
    }
});

client.login(token);
