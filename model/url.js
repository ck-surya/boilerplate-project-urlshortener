const mongoose = require('mongoose');
urlCount = 1;
const urlSchema = new mongoose.Schema({
    original_url: { type: String, required: true },
    short_url: { type: Number, default:()=>urlCount++ }
});

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;