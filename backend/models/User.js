const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    status: { type: String, enum: ["active", "invited", "suspended"], default: "active" },
    avatarColor: { type: String, default: "#3355FF" },
    avatarUrl: { type: String, default: "" },
    designation: { type: String, trim: true, maxlength: 100, default: "" }, // set by admin
    about: { type: String, trim: true, maxlength: 500, default: "" }, // self-editable bio
    authorSlug: { type: String, trim: true, unique: true, sparse: true },

    lastLogin: { type: Date },

    // Brute-force protection: lock the account after repeated failed logins.
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },

    // Refresh tokens are stored hashed so a leaked DB dump can't be replayed directly.
    refreshTokenHash: { type: String, select: false },

    // Password-reset flow: store a hashed one-time token + its expiry.
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

UserSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.pre("save", async function (next) {
  // Auto-generate authorSlug from name if missing or if name changed
  if (this.isModified("name") || !this.authorSlug) {
    this.authorSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 100);
      
    // Quick append a random string to avoid collisons for now, proper uniqueness requires querying DB
    const crypto = require("crypto");
    if (this.isNew || this.isModified("name")) {
        const hash = crypto.randomBytes(3).toString('hex');
        this.authorSlug = `${this.authorSlug}-${hash}`;
    }
  }

  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.registerFailedLogin = async function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_MINUTES = 15;

  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= MAX_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
    this.failedLoginAttempts = 0;
  }
  await this.save({ validateBeforeSave: false });
};

UserSchema.methods.registerSuccessfulLogin = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model("User", UserSchema);
