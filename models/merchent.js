const mongoose = require("mongoose")

const merchantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mobilenumber:{
        type : Number
    },
    address : {
        type : String
    }
})

const Merchant = mongoose.model("Merchant", merchantSchema)

module.exports = Merchant