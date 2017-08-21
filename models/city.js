const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let citySchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	parent: {
		type: String
	},
	description: {
		type: String,
	},
	location: {
		lat: Number,
		lng: Number
	},
	googleId: {
		type: String,
		unique: true
	},
	photo: {
		width: Number,
		reference: String
	},
	createdAt: {
		type: Date,
		default: Date.now()
	}
});

module.exports = mongoose.model('City', citySchema);