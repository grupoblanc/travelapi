const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Region = require('./region');

let countrySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  /* Place information */
  description: String,
  capital: String,
  currency: String,
  continent: String,
  // Bandera
  flagPhotoUrl: String,
  /* end */
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

countrySchema.pre('remove', function (next) {
  Region.remove({country: this._id}).exec();
  next();
});

module.exports = mongoose.model('Country', countrySchema);
