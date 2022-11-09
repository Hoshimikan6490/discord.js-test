const mongoose = require('mongoose'); //mongoDBを使用するためのおまじない

const profileSchema = new mongoose.Schema({
	_id: { type: String }, //ユーザーID
	name: { type: String }, //ユーザーネーム
	birthday_month: { type: String },
  birthday_day: { type: String },
  status: { type: String }
});

const model = mongoose.model('birthday', profileSchema);

module.exports = model;
