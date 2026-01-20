const mongoose = require("mongoose");

const shippingZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    cities: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    country: {
      type: String,
      required: true,
      default: "Pakistan",
    },
    province: {
      type: String,
      enum: [
        "Punjab",
        "Sindh",
        "KPK",
        "Balochistan",
        "Gilgit-Baltistan",
        "AJK",
        null,
      ],
      default: null,
      // Optional: Used for regional zones that cover entire provinces
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    baseWeightKg: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    pricePerExtraKg: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    deliveryTimeMin: {
      type: Number,
      required: true,
      default: 2,
    },
    deliveryTimeMax: {
      type: Number,
      required: true,
      default: 5,
    },
    freeShippingThreshold: {
      type: Number,
      default: null,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 50,
      // Lower number = higher priority in matching
      // Suggested: Major cities = 1, Regional zones = 50, Default/Remote = 99
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries
shippingZoneSchema.index({ isActive: 1, priority: -1 });
shippingZoneSchema.index({ cities: 1 });

// Ensure only one default zone exists
shippingZoneSchema.pre("save", async function () {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false },
    );
  }
});

// Method to check if city belongs to this zone (case-insensitive, fuzzy)
shippingZoneSchema.methods.matchesCity = function (cityName) {
  if (!cityName) return false;

  const normalizedInput = cityName.toLowerCase().trim();

  return this.cities.some((zoneCity) => {
    const normalizedZoneCity = zoneCity.toLowerCase().trim();

    // Exact match
    if (normalizedZoneCity === normalizedInput) return true;

    // Contains match
    if (normalizedZoneCity.includes(normalizedInput)) return true;
    if (normalizedInput.includes(normalizedZoneCity)) return true;

    // Fuzzy match for typos (Levenshtein distance)
    const distance = levenshteinDistance(normalizedZoneCity, normalizedInput);
    const maxLength = Math.max(
      normalizedZoneCity.length,
      normalizedInput.length,
    );
    const similarity = 1 - distance / maxLength;

    // Allow 20% difference for typos
    return similarity >= 0.8;
  });
};

// Simple Levenshtein distance implementation
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

module.exports = mongoose.model("ShippingZone", shippingZoneSchema);
