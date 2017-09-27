const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Tour = require('./tour');
let Review = require('./review');
let information = require('./information');

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
	Review.remove({place: this._id}).exec();
	Information.remove({place: this._id}).exec();
	next();
});

module.exports = mongoose.model('Place', placeSchema);