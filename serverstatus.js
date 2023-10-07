const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { bmApiKey, libServerId, trainingServerId } = require('./config.json');
const fetch = require('cross-fetch');

function buildEmbed(playersArray) {
    const playerEmbed = new EmbedBuilder()

    if (playersArray.length === 0) {
        playerEmbed.addFields({ name: '**Current Players**', value: 'No players currently online', inline: true });
        return playerEmbed;
    }

    let players1 = null;
    let players2 = null;
    let players3 = null;
    let players4 = null;
    let players5 = null;
    let players6 = null;

    players1 = playersArray.slice(0, 25).join('\n');
    players2 = playersArray.slice(25, 50).join('\n');
    players3 = playersArray.slice(50, 75).join('\n');
    players4 = playersArray.slice(75, 100).join('\n');
    players5 = playersArray.slice(100, 125).join('\n');
    players6 = playersArray.slice(125, 150).join('\n');

    if (players1.length > 0) { playerEmbed.addFields({ name: '**Current Players**', value: players1, inline: true }) };
    if (players2.length > 0) { playerEmbed.addFields({ name: '\u200B', value: players2, inline: true }) };
    if (players3.length > 0) { playerEmbed.addFields({ name: '\u200B', value: players3, inline: true }) };
    if (players4.length > 0) { playerEmbed.addFields({ name: '\u200B', value: players4, inline: true }) };
    if (players5.length > 0) { playerEmbed.addFields({ name: '\u200B', value: players5, inline: true }) };
    if (players6.length > 0) { playerEmbed.addFields({ name: '\u200B', value: players6, inline: true }) };

    return playerEmbed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverstatus')
        .setDescription('Fetches the status of the server from BattleMetrics')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const serverInfo = `https://api.battlemetrics.com/servers/${libServerId}`
        const now = new Date((Date.now())).toISOString();
        const infoIncludeParam = `?at=${now}&include=player,identifier`;

        const message = await interaction.reply({
            content: 'Fetching server status...',
            fetchReply: true,
            ephemeral: true
        });

        try {
            const serverInfoResponse = await fetch(serverInfo + `?include=session`, {
                headers: {
                    Authorization: `Bearer ${bmApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!serverInfoResponse.ok) {
                throw new Error(`${serverInfoResponse.status} - ${serverInfoResponse.statusText}`);
            }

            const serverData = await serverInfoResponse.json();

            const guildId = interaction.guildId;
            const name = serverData.data.attributes.name;
            const mission = serverData.data.attributes.details.mission;
            const map = serverData.data.attributes.details.map;
            const players = serverData.data.attributes.players;
            const maxPlayers = serverData.data.attributes.maxPlayers;

            let lastRestart = new Date(serverData.data.attributes.rconLastConnected);
            let lastClose = new Date(serverData.data.attributes.rconDisconnected);
            let restartTime = new Date(new Date(lastRestart).setHours(lastRestart.getHours() + 5)).getTime();
            lastRestart = new Date(lastRestart).getTime();

            let hours = Math.floor((Date.now() - lastRestart) / 1000 / 60 / 60);
            let minutes = Math.floor((Date.now() - lastRestart) / 1000 / 60) - (hours * 60);

            let hours2 = Math.floor((restartTime - Date.now()) / 1000 / 60 / 60);
            let minutes2 = Math.floor((restartTime - Date.now()) / 1000 / 60) - (hours2 * 60);

            if (lastClose > lastRestart) {
                hours = 0;
                minutes = 0;

                hours2 = 5;
                minutes2 = 0;
            }

            let playersArray = [];
            (serverData.included).forEach(data => {
                playersArray.push(data.attributes.name);
            });
            playersArray.sort();

            const statusEmbed = new EmbedBuilder()
                .setTitle(`${name}`)
                .addFields(
                    { name: 'Game', value: `\`\`\`${mission}\`\`\``, inline: true },
                    { name: 'Map', value: `\`\`\`${map}\`\`\``, inline: true },
                    { name: 'Players', value: `\`\`\`${players}/${maxPlayers}\`\`\``, inline: true },
                    { name: 'Uptime', value: `\`\`\`T+${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}\`\`\``, inline: true },
                    { name: 'Approximate Time Until Restart', value: `\`\`\`T-${hours2.toString().padStart(2, '0')}:${minutes2.toString().padStart(2, '0')}\`\`\``, inline: true }
                )
            const playerEmbed = buildEmbed(playersArray);

            await interaction.editReply({
                content: `Here is the current status of the server:`,
                fetchReply: true,
                ephemeral: true
            })

            const message = await interaction.channel.send({
                embeds: [statusEmbed, playerEmbed]
            })

        } catch (error) {
            console.log(error);
            await interaction.editReply({
                content: `There was an error fetching the server status.`,
                fetchReply: true,
                ephemeral: true
            });
        }
    }
}