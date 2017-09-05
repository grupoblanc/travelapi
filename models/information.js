const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let infoSchema = new Schema({
	lang: {
		type: String,
		required: true
	},
	text: {
		type: String,
		required: true
	},
	place: {
		type: Schema.ObjectId,
		ref: 'Place'
	},
	createdAt: {
		type: Date,
		default: Date.now()
	}
});

module.exports = mongoose.model('Information', infoSchema);