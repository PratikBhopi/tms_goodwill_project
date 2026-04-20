const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token_hash: { type: String, required: true },
  expires_at: { type: Date, required: true },
  used: { type: Boolean, default: false },
});

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
