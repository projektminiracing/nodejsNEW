// Shema za vehicle

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var VehicleSchema   = new Schema({
    user_id : String,
    manufacturer: String,
    color: String,
    driveWheel:{
        type: String,
        enum: ['Front', 'Rear', '4x4']
    },
    chargeTime: Number,
    batteryLeft: Number,
    acceleration: Number,
    topSpeed: Number,
    weight: Number,
    engine: {
        batteryConsumption: Number,
        horsePower: Number
    }
});

module.exports = mongoose.model('vehicle', VehicleSchema);