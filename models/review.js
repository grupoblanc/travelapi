const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let reviewSchema = new Schema({
	message: {
		type: String
	},
	rating: {
		type: Number,
		required: true,
	},
	photo: {
		type: String,
	},
	place: {
		type: Schema.ObjectId,
		ref: 'Place',
		required: true,
	},
	profile: {
		type: Schema.ObjectId,
		ref: 'Profile',
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('Review', reviewSchema);