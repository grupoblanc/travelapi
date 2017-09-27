const mongoose = require('mongoose');
let Place = require('./place');

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
	views: Number,
	photo: {
		width: Number,
		reference: String
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

citySchema.pre('remove', function(next) {
	Place.remove({ city: this._id }).exec();
	next();
})

module.exports = mongoose.model('City', citySchema);