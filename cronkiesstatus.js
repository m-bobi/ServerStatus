const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let statusMessage = null;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    const updateStatusMessage = async () => {
        try {
            const serverInfoResponse = await fetch(`https://api.battlemetrics.com/servers/${process.env.libServerID}?include=session`, {
                headers: {
                    Authorization: `Bearer ${process.env.bmAPIKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!serverInfoResponse.ok) {
                console.error(`${serverInfoResponse.status} - ${serverInfoResponse.statusText}`);
                return;
            }

            const serverData = await serverInfoResponse.json();
            const { data: { attributes: { status, name, players, maxPlayers, details: { map } } } } = serverData;

            const playerEmbed = new EmbedBuilder()
                .setColor(status === 'online' ? '#00FF00' : '#FF0000')
            const playersArray = serverData.included.map(data => data.attributes.name).sort();

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

            const currentTime = new Date();
            let lastRestartTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), Math.floor(currentTime.getHours() / 5) * 5, 0, 0, 0);
            if (currentTime - lastRestartTime < 0) {
                lastRestartTime.setDate(lastRestartTime.getDate() - 1);
            }
            const nextRestartTime = new Date(lastRestartTime.getTime() + 5 * 60 * 60 * 1000);
            let timeUntilRestart = new Date(nextRestartTime - currentTime);

            const hoursUntilRestart = Math.floor(timeUntilRestart / 1000 / 3600);
            const minutesUntilRestart = Math.floor((timeUntilRestart / 1000 / 60) % 60);

            console.log(`The next server restart will be in ${hoursUntilRestart} hours and ${minutesUntilRestart} minutes.`);
            console.log('testing')
            const statusEmbed = new EmbedBuilder()
                .setTitle(name)
                .setColor(status === 'online' ? '#00FF00' : '#FF0000')
                .addFields(
                    { name: 'Map', value: `\`\`\`${map}\`\`\``, inline: true },
                    { name: 'Players', value: `\`\`\`${players}/${maxPlayers}\`\`\``, inline: true },
                    { name: 'Status', value: `\`\`\`${status}\`\`\``, inline: true },
                    { name: 'Planned time for restart', value: `\`\`\`T-${hoursUntilRestart.toString().padStart(2, '0')}:${minutesUntilRestart.toString().padStart(2, '0')}\`\`\``, inline: true });

            if (statusMessage) {
                await statusMessage.edit({ embeds: [statusEmbed, playerEmbed] });
            } else {
                const channel = client.channels.cache.get(process.env.cronkiesChannelID);
                statusMessage = await channel.send({ embeds: [statusEmbed, playerEmbed] });
            }

        } catch (error) {
            console.log(error);
        }
    };
    setInterval(updateStatusMessage, 120000); // Call the updateStatusMessage function every 2 minutes

});

client.login(process.env.TOKEN);
