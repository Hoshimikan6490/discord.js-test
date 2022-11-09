const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers]
});

module.exports = {
  data: {
    name: "member_list_create",
    description: "🧰データベースを作成します！(Hoshimikan6490限定)",
  },
	async execute(interaction) {
    if (interaction.user.id === "728495196303523900") {
      if (interaction.guild.id === "889474199704436776") {
          // サーバー内の全メンバーを取得する
        const members = await interaction.guild.members.fetch()
          // mapを使って全メンバーのユーザータグの配列を作る
        const tags = members.map(member => member.user.id)

        const profileModel = require('../models/profileSchema.js');
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
        await interaction.editReply("✅データベースの作成が完了しました！")
      }
    }
  }
}
