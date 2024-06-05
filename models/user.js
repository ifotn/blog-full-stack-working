const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

// define schema for Media object
let userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        minLength: 8
    }
});

// inherit from passport-local-mongoose using the plugin() method
userSchema.plugin(plm);

let User = mongoose.model('User', userSchema);
module.exports = User;
