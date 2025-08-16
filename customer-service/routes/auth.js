const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Agent = require('../models/agent');

// Agent Registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        let agent = await Agent.findOne({ email });
        if (agent) {
            return res.status(400).json({ msg: 'Agent already exists' });
        }

        agent = new Agent({
            name,
            email,
            role,
        });

        const salt = await bcrypt.genSalt(10);
        agent.password = await bcrypt.hash(password, salt);

        await agent.save();

        const payload = {
            agent: {
                id: agent.id,
            },
        };

        jwt.sign(
            payload,
            process.env.CS_JWT_SECRET,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Agent Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        let agent = await Agent.findOne({ email });
        if (!agent) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, agent.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            agent: {
                id: agent.id,
            },
        };

        jwt.sign(
            payload,
            process.env.CS_JWT_SECRET,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
