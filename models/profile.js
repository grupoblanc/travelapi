const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');

let profileSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
	},
	tokenId: {
		type: String,
		required: true,
		unique: true,
	},
	type: {
		type: String,
	},
	photoUrl: String,
	experience: {
		type: Number,
		default: 0,
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	favorites: [{
		type: Schema.ObjectId,
		ref: 'Place',
	}],
});

profileSchema.pre('save', function (next) {
	Review.remove({ profile: this._id }).exec();
	next();
});

module.exports = mongoose.model('Profile', profileSchema);