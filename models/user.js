const mongoose = require('mongoose');

let User = mongoose.Schema({
  firstName: {type: String},
  lastName: {type: String},
  email: {type: String, unique: true},
  isAdmin: {type: Boolean, default: false},
  isOwner: {type: Boolean, default: false},
  slack: {
    name: {type: String, unique: true},
    id: {type: String, unique: true, index: true}
  },
  createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('User', User);
