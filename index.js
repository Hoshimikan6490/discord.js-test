const http = require('http');
http.createServer(function(req, res) {
  res.write('Discord bot its active.\nPleace check it.');
  res.end();
}).listen(8000);


const fs = require('fs')
// Discord bot implements
const { Client, GatewayIntentBits, InteractionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField  } = require('discord.js');
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers]
});
const mongoose = require('mongoose');
const mong_db_info = process.env['MongDB_info']
const prefix = "mc!"
const token = process.env['TOKEN']
const util = require('util')
const wait = util.promisify(setTimeout);

const commands = {}
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands[command.data.name] = command
}

// botが準備できれば発動され、 上から順に処理される。
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

mongoose //mongooseについて
	.connect(mong_db_info, {
		useNewUrlParser: true, //任意
	})
	.then(() => {
		console.log('データベースに接続したんだゾ');
	})
	.catch((error) => {
		console.log(error); //エラー出力
	});

//　ユーザー参加時の処理
client.on('guildMemberAdd',async member => {
  const profileModel = require('./models/profileSchema');
  const user_id = member.id
    //先ほど作成したスキーマを参照
	const profileData = await profileModel.findOne({
    _id: user_id
  });
	if (!profileData) {
    const user_name = (await client.users.fetch(user_id)).username
		const profile = await profileModel.create({
		  _id: user_id, //ユーザーID
	  	name: user_name, //ユーザーネーム
	  	birthday_month: "null",
      birthday_day: "null"
 		});
		profile.save();
		console.log('新規参加者をデータベースに登録したよ！');
  }
});

// botがメッセージを受信すると発動され、 上から順に処理される。
client.on("messageCreate", async message => {
  // プレフィクスが要らない系コマンド
  if (message.content.match(/jinbeおはよう/) || message.content.match(/おはようjinbe/)) {
    message.channel.send("おはよう！");
  } else if (message.content.match(/jinbeこんにちは/) || message.content.match(/こんにちはjinbe/)) {
    message.channel.send("こんにちわああああ！");
  } else if (message.content.match(/jinbeこんばんは/) || message.content.match(/こんばんはjinbe/)) {
    message.channel.send("こんばんわ！！");
  } else if (message.content.match(/jinbeおやすみ/) || message.content.match(/おやすみjinbe/)) {
    message.channel.send("おやすみ～\nいい夢見てね…");
  } else if (message.content === "omikuji" || message.content === "jinbe" || message.content === "omikujinbe") {
    const omikuji_choice = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('omi1')
          .setLabel('を引く')
          .setStyle(ButtonStyle.Primary)
          .setEmoji("1️⃣"),
        new ButtonBuilder()
          .setCustomId('omi2')
          .setLabel('を引く')
          .setStyle(ButtonStyle.Success)
          .setEmoji("2️⃣"),
        new ButtonBuilder()
          .setCustomId('omi3')
          .setLabel('を引く')
          .setStyle(ButtonStyle.Danger)
          .setEmoji("3️⃣"),
      );
    const replay = await message.channel.send({
      embeds: [
        {
          title: "↓直感で押して！↓",
          color: 0xFF0000,
          thumbnail: {
            url: "https://3.bp.blogspot.com/-cPqdLavQBXA/UZNyKhdm8RI/AAAAAAAASiM/NQy6g-muUK0/s400/syougatsu2_omijikuji2.png"
          }
        }
      ],
      // , tic2, tic3
      components: [omikuji_choice]
    });
    await wait(6000)
    replay.delete()
  } else if (message.content === 'janken') {
    const janken_choice = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('pa')
          .setLabel('パー')
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🖐"),
        new ButtonBuilder()
          .setCustomId('cho')
          .setLabel('チョキ')
          .setStyle(ButtonStyle.Success)
          .setEmoji("✌"),
        new ButtonBuilder()
          .setCustomId('gu')
          .setLabel('グー')
          .setStyle(ButtonStyle.Danger)
          .setEmoji("✊"),
      );
    const replay = await message.channel.send({
      embeds: [
        {
          title: "↓何を出す？！↓",
          color: 0xFF0000,
          thumbnail: {
            url: "https://tsukatte.com/wp-content/uploads/2019/03/janken-520x520.png"
          }
        }
      ],
      components: [janken_choice]
    });
    await wait(6000)
    replay.delete()
  }

  // プレフィクスが必要系コマンド
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  let cancel_button = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel('このメッセージを削除する')
        .setStyle(ButtonStyle.Secondary),
    );

  if (command === 'member_list_create' || command === 'database_create') {
    if (message.guild.id === "889474199704436776") {
      const replay = await message.channel.send("🔄処理中…")
       // サーバー内の全メンバーを取得する
      const members = await message.guild.members.fetch()
       // mapを使って全メンバーのユーザータグの配列を作る
      const tags = members.map(member => member.user.id)
      
      const profileModel = require('./models/profileSchema');
      for (var key in tags) {
        const user_id = tags[key]
        //先ほど作成したスキーマを参照
	      const profileData = await profileModel.findOne({
          _id: user_id
        });
	      if (!profileData) {
          const user_name = (await client.users.fetch(user_id)).username
		      const profile = await profileModel.create({
		  	    _id: tags[key], //ユーザーID
	  	  	  name: user_name, //ユーザーネーム
	  	  	  birthday_month: "null",
            birthday_day: "null",
            status: "yet"
 		      });
		      profile.save();
		      console.log('データベースに作成したよ！');
            //一応ログとしてコンソールに出力
        }
      }
      replay.edit("✅データベースの作成が完了しました！")
    }
  } else if (command === 'member_list_show') {
    const replay = await message.channel.send("🔄データを取得中…")
    const profileModel = require('./models/profileSchema');
    let database_members = await profileModel.find({});
    let member_list = database_members.map(database_members => database_members.name);
    replay.edit({
      content: '',
      embeds: [
        {
          title: '現在、データベースに登録されているユーザー一覧',
          description: '※誕生日が登録されていないユーザーも含みます。\n```' + member_list.join('\n') + '\n```',
          color: 0xaad0ff,
          timestamp: new Date(),
        }
      ]
    });
  } else if (command === 'member_list_delete' || command === 'member_list_remove') {
    if (message.author.id === '728495196303523900') {
      const delete_database_YesNo = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('delete_database_Yes')
            .setLabel('削除')
            .setStyle(ButtonStyle.Danger)
            .setEmoji("⚠"),
          new ButtonBuilder()
            .setCustomId('delete_database_No')
            .setLabel('キャンセル')
            .setStyle(ButtonStyle.Secondary),
        );
      message.channel.send({
        embeds: [
          {
            title: '誕生日データベースの情報を全て削除します。よろしいですか？',
            description: 'この操作は復元不可能でつ❗️',
            color: 0xFF0000,
          }
        ],
        components: [delete_database_YesNo]
      });
    } else {
      message.channel.send({
        embeds: [
          {
            title: '申し訳ございません。このコマンドは実行できません！',
            description: 'このコマンドは、<@728495196303523900>のみ有効です。',
            color: 0xFFFF00,
          }
        ],
        components: [cancel_button]
      })
    }
  } else if (command === 'birthday_register')　{
    
  } else if (command === 'hb') {
    const happy_birthday_user = message.content.split(" ").slice(1).join(" ")
    if (!happy_birthday_user) {
      message.channel.send({
        content: "エラー:誕生日をお祝いする相手を書いていません",
        components: [cancel_button]
      });
    } else {
      message.channel.send({
        content: happy_birthday_user,
        embeds: [
          {
            title: '🎊たんおめ！🎊',
            description: happy_birthday_user + 'さん　お誕生日おめでとうございます！',
            color: 0xFF30FF,
            timestamp: new Date()
          }
        ]
      });
      message.delete();
    }
  } else if (command === '2022') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      let response = await message.channel.send({
        content: 'あなたは、このサーバーの管理者権限を持っていません。\nこのコマンドの実行には管理者権限が必須です。'
      });
      await wait(5000)
      response.delete()
      await wait(1000)
      message.delete()
    } else {
      message.channel.send({
        embeds: [
          {
            title: 'これ以降は2022年度の情報です！',
            color: 0xFF0000,
            timestamp: new Date()
          }
        ]
      });
      message.delete();
    }
  } else if (command === 'about') {
    const tic4 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setURL("https://discord.com/api/oauth2/authorize?client_id=946587263691788399&permissions=274878000128&scope=bot")
          .setLabel('BOTを招待する')
          .setStyle(ButtonStyle.Link),
      );
    message.channel.send({
      embeds: [{
        title: "このBOTについて",
        description: "作成：Hoshimikan6490",
        color: 3823616,
        timestamp: new Date(),
        thumbnail: {
          url: 'attachment://file.png'
        }
      }
      ],
      files: [{ attachment: "photos/jinbe_yoshi.png", name: "file.png" }
      ],
      components: [tic4]
    });
  } else if (command === 'ping') {
    message.channel.send({
      embeds: [
        {
          title: '🏓Ping!!',
          description: `Pingは ${Date.now() - message.createdTimestamp}msです。\n APIのPingは ${Math.round(client.ws.ping)}msです。`,
          color: 15132165,
          timestamp: new Date()
        }
      ]
    });
  } else if (command === "aisatu_list") {
    message.channel.send({
      embeds: [
        {
          title: "挨拶一覧",
          description: "・`jinbeおはよう`\n・`おはようjinbe`\n・`jinbeこんにちは`\n・`こんにちはjinbe`\n・`jinbeこんばんは`\n・`こんばんはjinbe`\n・`jinbeおやすみ`\n・`おやすみjinbe`",
          color: 0x00FF00,
          timestamp: new Date()
        }
      ]
    })
  } else if (command === "help_omikuji") {
    message.channel.send({
      embeds: [
        {
          title: "omikujiコマンドの使い方",
          description: "①「omikuji」と送信する\n\n②３つのボタンから、好きなものを選んで、押す。\n（数秒後にこのメッセージは消えます）\n\n③結果が表示される。",
          color: 0x00FF00,
          timestamp: new Date()
        }
      ]
    })
  } else if (command === "code") {
    message.channel.send({
      embeds: [
        {
          title: "このBOTのプログラム",
          description: "転用可",
          color: 0x227fff
        }
      ],
      files: ['index.js']
    });
  } else {
    message.channel.send({
      embeds: [
        {
          title: "エラー",
          description: "申し訳ございません。そのコマンドは見つかりませんでした。\n`mc!help`を実行して、コマンドを確認してください。",
          color: 0xFF0000,
          timestamp: new Date()
        }
      ]
    });
  }
});
client.on('interactionCreate', async (interaction) => {
  if (interaction.customId === "omi1" || interaction.customId === "omi2" || interaction.customId === "omi3") {
    const wait = require('node:timers/promises').setTimeout;
    await interaction.deferReply();
    const arr = ['大吉', '中吉', '小吉', '吉', '凶', '大凶', 'じんべえ吉', 'じんべえ凶'];
    const random = Math.floor(Math.random() * arr.length);
    const result = arr[random];

    if (random === 4 || random === 7) {
      var file_pas = "photos/jinbe_pien.png";
    } else if (random === 5) {
      var file_pas = "photos/jinbe_pien2.png";
    } else {
      var file_pas = "photos/jinbe.png";
    }
    if (interaction.customId === "omi1") {
      var number = "1";
    } else if (interaction.customId === "omi2") {
      var number = "2";
    } else {
      var number = "3";
    }

    await interaction.editReply({
      embeds: [
        {
          title: 'おみくじの結果！',
          description: 'あなたは、' + result + 'を引きました！\n\n||`ここだけの話、`<@' + interaction.user.id + '> `さんは、' + number + 'を押したらしいよ...`||',
          color: 4817413,
          thumbnail: {
            url: 'attachment://omi_kekka.png'
          }
        }
      ],
      files: [{ attachment: file_pas, name: "omi_kekka.png" }
      ],
    });
  }
  // じゃんけんの処理
  if (interaction.customId === "pa" || interaction.customId === "cho" || interaction.customId === "gu") {
    const wait = require('node:timers/promises').setTimeout;
    await interaction.deferReply();
    // じんべえの手を決める
    const arr = ['pa', 'cho', 'gu'];
    const random = Math.floor(Math.random() * arr.length);
    const jinbe = arr[random];
    // 自分の手を「me」に代入
    if (interaction.customId === "pa") {
      var me = "pa"
    } else if (interaction.customId === "cho") {
      var me = "cho"
    } else if (interaction.customId === "gu") {
      var me = "gu"
    }
    // 結果判定    
    // 自分がパーの時
    if (interaction.customId === "pa") {
      if (jinbe === "pa") {
        var jan_result = "aiko"
      } else if (jinbe === "cho") {
        var jan_result = "lose"
      } else if (jinbe === "gu") {
        var jan_result = "win"
      }
      // 自分がチョキの時
    } else if (interaction.customId === "cho") {
      if (jinbe === "pa") {
        var jan_result = "win"
      } else if (jinbe === "cho") {
        var jan_result = "aiko"
      } else if (jinbe === "gu") {
        var jan_result = "lose"
      }
    } else if (interaction.customId === "gu") {
      // 自分がグーの時
      if (jinbe === "pa") {
        var jan_result = "lose"
      } else if (jinbe === "cho") {
        var jan_result = "win"
      } else if (jinbe === "gu") {
        var jan_result = "aiko"
      }
    }
    // 変数調整
    //me変数の日本語化
    if (me === "pa") {
      var result_me = "パー"
    } else if (me === "cho") {
      var result_me = "チョキ"
    } else if (me === "gu") {
      var result_me = "グー"
    }
    //jinbe変数の日本語化
    if (jinbe === "pa") {
      var result_jinbe = "パー"
    } else if (jinbe === "cho") {
      var result_jinbe = "チョキ"
    } else if (jinbe === "gu") {
      var result_jinbe = "グー"
    }
    //結果の日本語化
    if (jan_result === "win") {
      var result_jinbe_jp = "あなたの勝ち"
    } else if (jan_result === "aiko") {
      var result_jinbe_jp = "あいこ"
    } else if (jan_result === "lose") {
      var result_jinbe_jp = "あなたの負け"
    }
    // 色調整
    if (jan_result === "win") {
      var color = 0xFF0000
    } else if (jan_result === "aiko") {
      var color = 0xFFFF00
    } else if (jan_result === "lose") {
      var color = 0x0000FF
    }
    // file_pass設定
    if (jan_result === "win") {
      var file_pas = "photos/win.png"
    } else if (jan_result === "aiko") {
      var file_pas = "photos/aiko.png"
    } else if (jan_result === "lose") {
      var file_pas = "photos/lose.png"
    }
    // 結果表示
    await interaction.editReply({
      embeds: [
        {
          title: 'じゃんけんの結果！',
          description: 'あなたは ' + result_me + 'を出して、\n私は　' + result_jinbe + 'を出したので、\n\n__**' + result_jinbe_jp + 'です！**__',
          color: color,
          thumbnail: {
            url: 'attachment://omi_kekka.png'
          }
        }
      ],
      files: [{ attachment: file_pas, name: "omi_kekka.png" }
      ],
    });
  }

  if (interaction.customId === "cancel") {
    interaction.message.delete()
  }

  if (interaction.customId === 'delete_database_Yes') {
    await interaction.deferReply();
    const model = require('./models/profileSchema');
    model.deleteMany({},function(err){
      if(err)
        {
          interaction.editReply('内部エラーが発生しました。\nコンソールを確認してください！');
          console.error(err)
        }
        else{
          interaction.editReply('✅削除しました！');
        }
    });
    interaction.message.delete();
  } else if (interaction.customId === 'delete_database_No') {
    interaction.message.delete()
  }

  if (!interaction.type === InteractionType.ApplicationCommand) {
    return;
  }
  const command = commands[interaction.commandName];
  try {
    await command?.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: '内部エラーが発生しました。管理者にお問い合わせください。',
      ephemeral: true,
    })
  }
});

// botログイン
client.login(token);
