const mongoose = require('mongoose');
const Schema = mongoose.Schema;

Tour = require('./tour');

let placeSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	city: {
		type: Schema.ObjectId,
		ref: 'City'
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
	photos: [{
		width: Number,
		photo_reference: String
	}],
	opening_hours: {
		open_now: {
			type: Boolean,
			default: false
		},
		weekdays: {
			type: [String],
		}
	},
	rating: Number,
	types: [String],
	website: String,
	createdAt: {
		type: Date,
		default: Date.now
	}
});

placeSchema.pre('remove', function(next) {
	Tour.remove({ parent: this._id }).exec();
});

module.exports = mongoose.model('Place', placeSchema);