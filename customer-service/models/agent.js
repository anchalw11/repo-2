const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ['Agent', 'Senior Agent', 'Manager'],
        default: 'Agent',
    },
    status: {
        type: String,
        enum: ['Online', 'Offline', 'Away'],
        default: 'Offline',
    },
    avatar: {
        type: String,
        default: '',
    },
});

module.exports = mongoose.model('Agent', agentSchema);
