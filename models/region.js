const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let City = require('./city');

let regionSchema = new Schema({
  name: {
    type: String
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
  City.remove({parent: this._id}).exec();
  next();
});

module.exports = mongoose.model('Region', regionSchema);
