const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let Place = require('./place');
let Tour = require('./tour');

let citySchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	parent: {
		type: String
	},
	category: String,
	region: {
    ref: 'Region',
    type: Schema.ObjectId
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
	Tour.remove({ city: this._id}).exec();
	next();
})

module.exports = mongoose.model('City', citySchema);
