const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    agent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
    },
    metric_type: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Analytics', analyticsSchema);
