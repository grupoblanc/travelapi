const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let tourSchema = new Schema({
	name: {
			type: String,
			required: true
		},
	description: String,
	city: {
		type: Schema.ObjectId,
		ref: 'City'
	},
	totalTime: Number,
	totalDistance: Number,
	photo: {
		width: Number,
		reference: String,
	},
	places: {
		type: [{
			type: Schema.ObjectId,
			ref: 'Place'
		}]
	}
});

module.exports = mongoose.model('Tour', tourSchema);