const http = require('http');
http.createServer(function(req, res) {
  res.write('Discord bot is active.\nPleace check it.');
  res.end();
}).listen(8000);


const fs = require('fs')
const { Client, GatewayIntentBits, Partials, InteractionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers]
});

const commands = {}
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands[command.data.name] = command
}

client.once("ready", async () => {
  const data = []
  for (const commandName in commands) {
    data.push(commands[commandName].data)
  }
  await client.application.commands.set(data);
  console.log("Ready!");
  setInterval(() => {
    client.user.setActivity({
      name: `所属サーバー数は、${client.guilds.cache.size}サーバー｜Ping値は、${client.ws.ping}ms｜replitで起動中です`,
    });
  }, 10000);
  client.channels.cache.get('889486664760721418').send('起動しました！');
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.customId == "test") {
    interaction.reply("GOOOOOOOOOOOOOD!")
  }
  
  if (!interaction.type === InteractionType.ApplicationCommand) {
    return;
  }
  const command = commands[interaction.commandName];
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: '内部エラーが発生しました。管理者にお問い合わせください。',
      ephemeral: true,
    })
  }
});

///////////////////////////////////////////////////////////////////////////////

client.on("messageCreate", async message => {
  if (message.content === "mca!test") {
    const button = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('test')
          .setLabel('TEST')
          .setStyle(ButtonStyle.Primary)
          .setEmoji("💞")
        );
    message.channel.send({
      content: "TEST!!!!!!!!!!",
      components: [button]
    });
  }
});

client.login(process.env.TOKEN);
