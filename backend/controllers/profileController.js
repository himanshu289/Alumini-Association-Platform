const Alumni = require('../models/Alumni');

// Get Alumni Profile by Email
exports.getProfile = async (req, res) => {
    try {
        const { email } = req.params;
        const profile = await Alumni.findOne({ email });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update Alumni Profile by Email
exports.updateProfile = async (req, res) => {
    try {
        const { email } = req.params;
        const updatedData = req.body;

        const profile = await Alumni.findOneAndUpdate(
            { email },
            updatedData,
            { new: true, runValidators: true }
        );

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.status(200).json({ message: 'Profile updated', profile });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
