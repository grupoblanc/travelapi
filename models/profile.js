const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');
const bcrypt = require('bcrypt-nodejs');

let profileSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
	},
	password: String,
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

profileSchema.pre('remove', function (next) {
	Review.remove({ profile: this._id }).exec();
	next();
});

profileSchema.pre('save', function (next) {
	const user = this;
	if (user.password !== undefined && user.password.length > 0) {
		bcrypt.genSalt(10, (err, salt) => {
			if (err) { next(err); }
			if (salt) {
				bcrypt.hash(user.password, salt, null, (err, hash) => {
					if (err) { next(err); }
					user.password = hash;
					next();
				})
			}
		});
	} else {
		next();
	}
});

profileSchema.methods.comparePassword = function (candidatePass, callback) {
	bcrypt.compare(candidatePass, this.password, (err, isMatch) => {
		cb(err, isMatch);
	});
}

module.exports = mongoose.model('Profile', profileSchema);
