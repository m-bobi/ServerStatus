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
            const playersArray = serverData.included.map(data => data.attributes.name).sort();

            const currentTime = new Date();
            const nextRestartTime = new Date(currentTime.getTime() + 5 * 60 * 60 * 1000);
            const timeUntilRestart = new Date(nextRestartTime - currentTime);

            const hoursUntilRestart = timeUntilRestart.getUTCHours();
            const minutesUntilRestart = timeUntilRestart.getUTCMinutes();

            console.log(`The next server restart will be in ${hoursUntilRestart} hours and ${minutesUntilRestart} minutes.`);

            const playerEmbed = new EmbedBuilder()
                .setTitle(playersArray.length === 0 ? 'No Players online' : 'Current Players')
                .setColor(status === 'online' ? '#00FF00' : '#FF0000');

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
            console.error(error);
        }
    };

    updateStatusMessage(); // Call the updateStatusMessage function immediately
    setInterval(updateStatusMessage, 60000); // Call the updateStatusMessage function every minute

});

client.login(process.env.TOKEN);
