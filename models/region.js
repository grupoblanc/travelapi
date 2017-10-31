const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let City = require('./city');
let Tour = require('./tour');

let regionSchema = new Schema({
  name: {
    type: String
  },
  country: {
    ref: 'Country',
    type: Schema.ObjectId
  },
  location: {
    lat: Number,
    lng: Number
  },
  photo: {
    reference: String,
    width: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

regionSchema.pre('save', function(next) {
  City.remove({region: this._id}).exec();
  Tour.remove({ region: this._id}).exec();
  next();
});

module.exports = mongoose.model('Region', regionSchema);
