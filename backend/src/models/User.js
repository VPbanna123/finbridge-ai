import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // Existing accounts are treated as verified; registration explicitly
    // writes false when a verification email is sent.
    emailVerified: { type: Boolean, default: true },
    emailVerifiedAt: { type: Date },
    emailVerificationSentAt: { type: Date },
    emailVerificationCodeHash: { type: String, select: false },
    emailVerificationCodeExpiresAt: { type: Date },
    emailVerificationAttempts: { type: Number, default: 0 },
    profileImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    // Financial fields have NO defaults: unknown stays unknown until the
    // user actually provides them (survey or manual profile edit).
    ageGroup: {
      type: String,
      enum: ["18-25", "26-40", "41-60", "60+", "other"],
    },
    occupation: {
      type: String,
      enum: [
        "student",
        "salaried",
        "small_business",
        "farmer",
        "daily_wage",
        "homemaker",
        "senior_citizen",
        "other",
      ],
    },
    incomeRange: {
      type: String,
      enum: ["below_15000", "15000_30000", "30000_60000", "above_60000"],
    },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    language: { type: String, default: "en", enum: ["en", "hi", "kn"] },
    financialGoals: [{ type: String }],
    riskPreference: {
      type: String,
      enum: ["low", "medium", "high"],
    },
    surveyCompletedAt: { type: Date },
  },
  { timestamps: true }
);

// The field-level unique constraint creates the email index; no username index is defined.

// Remove sensitive fields in JSON
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.emailVerificationCodeHash;
  delete obj.emailVerificationCodeExpiresAt;
  delete obj.emailVerificationAttempts;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model("User", userSchema);
