const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let placeSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	city: {
		type: Schema.ObjectId,
		ref: 'City'
	},
	description: {
		type: String,
	},
	address: {
		type: String,
	},
	location: {
		lat: Number,
		lng: Number
	},
	phone_number: {
		type: String,
	},
	googleId: {
		type: String,
		unique: true,
	},
	photo: {
		width: Number,
		reference: String
	},
	opening_hours: {
		open_now: {
			type: Boolean,
			default: false
		},
		weekdays: {
			type: [String],
		}
	},
	types: [String],
	website: String,
	createdAt: {
		type: Date,
		default: Date.now()
	}
});

module.exports = mongoose.model('Place', placeSchema);