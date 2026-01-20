const ShippingZone = require("../models/ShippingZone");
const Order = require("../models/Order");
const Product = require("../models/Product");

// City to Province mapping for intelligent zone matching
const CITY_TO_PROVINCE_MAP = {
  // Punjab cities (major and notable towns)
  lahore: "Punjab",
  faisalabad: "Punjab",
  multan: "Punjab",
  rawalpindi: "Punjab",
  gujranwala: "Punjab",
  sialkot: "Punjab",
  sargodha: "Punjab",
  bahawalpur: "Punjab",
  "wan bhachran": "Punjab",
  mianwali: "Punjab",
  khushab: "Punjab",
  bhakkar: "Punjab",
  layyah: "Punjab",
  muzaffargarh: "Punjab",
  dera: "Punjab",
  "dera ghazi khan": "Punjab",
  sahiwal: "Punjab",
  jhang: "Punjab",
  sheikhupura: "Punjab",
  gujrat: "Punjab",
  kasur: "Punjab",
  okara: "Punjab",
  wazirabad: "Punjab",
  chiniot: "Punjab",
  kamoke: "Punjab",
  jhelum: "Punjab",
  sadiqabad: "Punjab",
  khanewal: "Punjab",
  hafizabad: "Punjab",
  rahim: "Punjab",
  "rahim yar khan": "Punjab",
  attock: "Punjab",
  vehari: "Punjab",
  muridke: "Punjab",
  pakpattan: "Punjab",
  chakwal: "Punjab",

  // Sindh cities
  karachi: "Sindh",
  hyderabad: "Sindh",
  sukkur: "Sindh",
  larkana: "Sindh",
  nawabshah: "Sindh",
  mirpurkhas: "Sindh",
  jacobabad: "Sindh",
  shikarpur: "Sindh",
  khairpur: "Sindh",
  dadu: "Sindh",
  thatta: "Sindh",
  badin: "Sindh",
  tando: "Sindh",
  "tando allahyar": "Sindh",
  "tando muhammad khan": "Sindh",
  umerkot: "Sindh",
  sanghar: "Sindh",
  ghotki: "Sindh",

  // KPK cities
  peshawar: "KPK",
  mardan: "KPK",
  abbottabad: "KPK",
  swat: "KPK",
  kohat: "KPK",
  mingora: "KPK",
  dera: "KPK",
  "dera ismail khan": "KPK",
  mansehra: "KPK",
  nowshera: "KPK",
  swabi: "KPK",
  charsadda: "KPK",
  bannu: "KPK",
  haripur: "KPK",
  karak: "KPK",
  hangu: "KPK",
  malakand: "KPK",

  // Balochistan cities
  quetta: "Balochistan",
  gwadar: "Balochistan",
  turbat: "Balochistan",
  khuzdar: "Balochistan",
  hub: "Balochistan",
  chaman: "Balochistan",
  sibi: "Balochistan",
  zhob: "Balochistan",
  loralai: "Balochistan",
  pishin: "Balochistan",
  dera: "Balochistan",
  "dera murad jamali": "Balochistan",

  // Gilgit-Baltistan
  gilgit: "Gilgit-Baltistan",
  skardu: "Gilgit-Baltistan",
  hunza: "Gilgit-Baltistan",
  chilas: "Gilgit-Baltistan",
  ghanche: "Gilgit-Baltistan",

  // AJK (Azad Jammu Kashmir)
  muzaffarabad: "AJK",
  mirpur: "AJK",
  kotli: "AJK",
  rawalakot: "AJK",
  bagh: "AJK",
  bhimber: "AJK",
};

// Detect province from city name
const detectProvince = (city) => {
  if (!city) return null;
  const normalizedCity = city.toLowerCase().trim();
  return CITY_TO_PROVINCE_MAP[normalizedCity] || null;
};

// Normalize country codes to full names
const normalizeCountry = (countryInput) => {
  const countryMap = {
    PK: "Pakistan",
    PAK: "Pakistan",
    PAKISTAN: "Pakistan",
    US: "United States",
    USA: "United States",
    UK: "United Kingdom",
    GB: "United Kingdom",
    AE: "UAE",
    UAE: "UAE",
    SA: "Saudi Arabia",
    KSA: "Saudi Arabia",
  };

  const normalized = countryMap[countryInput.toUpperCase()];
  return normalized || countryInput; // Return original if no mapping found
};

// Calculate shipping cost for given items and destination
exports.calculateShipping = async (req, res) => {
  try {
    let { items, city, country } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items provided",
      });
    }

    if (!city || !country) {
      return res.status(400).json({
        success: false,
        message: "City and country are required",
      });
    }

    // Normalize country code to full name
    country = normalizeCountry(country);

    // Calculate total weight from items
    let totalWeight = 0;
    const itemDetails = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      const weight = (product.weight || 0.5) * item.quantity;
      totalWeight += weight;

      itemDetails.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        weight: weight,
        price: product.price,
      });
    }

    // Calculate subtotal
    const subtotal = itemDetails.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Find matching zone with multi-layer approach
    const zones = await ShippingZone.find({ isActive: true }).sort({
      priority: 1, // Lower priority number = higher priority
    });

    console.log(
      `[Shipping] Looking for city: "${city}", country: "${country}"`,
    );
    console.log(`[Shipping] Found ${zones.length} active zones`);

    let matchedZone = null;

    // LAYER 1: Try to find zone by exact city match
    for (const zone of zones) {
      if (
        zone.matchesCity(city) &&
        zone.country.toLowerCase() === country.toLowerCase()
      ) {
        console.log(`[Shipping] ✓ LAYER 1 - Exact city match: ${zone.name}`);
        matchedZone = zone;
        break;
      }
    }

    // LAYER 2: Try province-based match if no city match found
    if (!matchedZone) {
      const detectedProvince = detectProvince(city);
      if (detectedProvince) {
        console.log(
          `[Shipping] LAYER 2 - Detected province: ${detectedProvince}`,
        );

        for (const zone of zones) {
          // Check if zone has province field and matches
          if (
            zone.province &&
            zone.province.toLowerCase() === detectedProvince.toLowerCase() &&
            zone.country.toLowerCase() === country.toLowerCase()
          ) {
            console.log(
              `[Shipping] ✓ LAYER 2 - Province match: ${zone.name} (${zone.province})`,
            );
            matchedZone = zone;
            break;
          }

          // Also check if zone name includes province (fallback)
          if (
            !zone.province &&
            zone.name.toLowerCase().includes(detectedProvince.toLowerCase()) &&
            zone.country.toLowerCase() === country.toLowerCase()
          ) {
            console.log(
              `[Shipping] ✓ LAYER 2 - Zone name includes province: ${zone.name}`,
            );
            matchedZone = zone;
            break;
          }
        }
      } else {
        console.log(`[Shipping] LAYER 2 - No province detected for "${city}"`);
      }
    }

    // LAYER 3: Use default/remote zone as fallback
    if (!matchedZone) {
      console.log(`[Shipping] LAYER 3 - Looking for default zone`);
      matchedZone = await ShippingZone.findOne({
        isDefault: true,
        isActive: true,
      });
      if (matchedZone) {
        console.log(
          `[Shipping] ✓ LAYER 3 - Using default zone: ${matchedZone.name}`,
        );
      }
    }

    if (!matchedZone) {
      return res.status(400).json({
        success: false,
        message: "Delivery not available in this area. Please contact support.",
      });
    }

    // Calculate shipping cost
    let shippingCost = matchedZone.basePrice;
    let extraWeightCharge = 0;

    if (totalWeight > matchedZone.baseWeightKg) {
      const extraWeight = totalWeight - matchedZone.baseWeightKg;
      extraWeightCharge = Math.ceil(extraWeight) * matchedZone.pricePerExtraKg;
      shippingCost += extraWeightCharge;
    }

    // Check for free shipping
    let freeShippingApplied = false;
    if (
      matchedZone.freeShippingThreshold &&
      subtotal >= matchedZone.freeShippingThreshold
    ) {
      shippingCost = 0;
      freeShippingApplied = true;
    }

    // Determine shipping message
    let shippingMessage = "";
    if (freeShippingApplied) {
      shippingMessage = "Free shipping applied";
    } else if (matchedZone.isDefault) {
      shippingMessage = "Remote area charges applied";
    } else if (extraWeightCharge > 0) {
      shippingMessage = "Extra weight charges included";
    } else {
      shippingMessage = "Standard shipping";
    }

    return res.json({
      success: true,
      data: {
        zoneName: matchedZone.name,
        zoneId: matchedZone._id,
        city: city,
        country: country,
        totalWeight: totalWeight.toFixed(2),
        basePrice: matchedZone.basePrice,
        extraWeightCharge: extraWeightCharge,
        shippingCost: shippingCost,
        subtotal: subtotal,
        total: subtotal + shippingCost,
        deliveryTime: `${matchedZone.deliveryTimeMin}-${matchedZone.deliveryTimeMax} days`,
        freeShippingApplied: freeShippingApplied,
        shippingMessage: shippingMessage,
        items: itemDetails,
      },
    });
  } catch (error) {
    console.error("Calculate shipping error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate shipping",
      error: error.message,
    });
  }
};

// Get all shipping zones (Admin)
exports.getAllZones = async (req, res) => {
  try {
    const zones = await ShippingZone.find().sort({ priority: -1, name: 1 });

    return res.json({
      success: true,
      data: zones,
    });
  } catch (error) {
    console.error("Get zones error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch zones",
      error: error.message,
    });
  }
};

// Get single zone (Admin)
exports.getZone = async (req, res) => {
  try {
    const zone = await ShippingZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Zone not found",
      });
    }

    return res.json({
      success: true,
      data: zone,
    });
  } catch (error) {
    console.error("Get zone error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch zone",
      error: error.message,
    });
  }
};

// Create shipping zone (Admin)
exports.createZone = async (req, res) => {
  try {
    const zoneData = req.body;

    // Validate required fields
    if (!zoneData.name) {
      return res.status(400).json({
        success: false,
        message: "Zone name is required",
      });
    }

    // Either cities or province must be provided
    if (
      (!zoneData.cities || zoneData.cities.length === 0) &&
      !zoneData.province
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one city or a province/region must be specified for the zone",
      });
    }

    // Create zone
    const zone = await ShippingZone.create(zoneData);

    return res.status(201).json({
      success: true,
      message: "Shipping zone created successfully",
      data: zone,
    });
  } catch (error) {
    console.error("Create zone error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create zone",
      error: error.message,
    });
  }
};

// Update shipping zone (Admin)
exports.updateZone = async (req, res) => {
  try {
    const zone = await ShippingZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Zone not found",
      });
    }

    // Update zone
    Object.assign(zone, req.body);
    await zone.save();

    return res.json({
      success: true,
      message: "Shipping zone updated successfully",
      data: zone,
    });
  } catch (error) {
    console.error("Update zone error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update zone",
      error: error.message,
    });
  }
};

// Toggle zone active status (Admin) - with pending orders check
exports.toggleZoneStatus = async (req, res) => {
  try {
    const zone = await ShippingZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Zone not found",
      });
    }

    const { force } = req.body;

    // If disabling zone, check for pending orders
    if (zone.isActive && !force) {
      const pendingOrders = await Order.countDocuments({
        "shippingDetails.zoneId": zone._id,
        status: { $in: ["pending", "processing"] },
      });

      if (pendingOrders > 0) {
        return res.json({
          success: false,
          requiresConfirmation: true,
          pendingOrdersCount: pendingOrders,
          message: `This zone has ${pendingOrders} pending order(s). Do you want to proceed?`,
        });
      }
    }

    // If force is true or no pending orders, toggle status
    zone.isActive = !zone.isActive;
    await zone.save();

    // If forced and there were pending orders, optionally cancel them
    if (force && !zone.isActive) {
      await Order.updateMany(
        {
          "shippingDetails.zoneId": zone._id,
          status: { $in: ["pending", "processing"] },
        },
        {
          status: "cancelled",
          cancelReason: `Delivery service disabled in ${zone.name}`,
        },
      );
    }

    return res.json({
      success: true,
      message: `Zone ${zone.isActive ? "enabled" : "disabled"} successfully`,
      data: zone,
    });
  } catch (error) {
    console.error("Toggle zone error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle zone status",
      error: error.message,
    });
  }
};

// Delete shipping zone (Admin)
exports.deleteZone = async (req, res) => {
  try {
    const zone = await ShippingZone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Zone not found",
      });
    }

    // Check if zone has any orders (past or pending)
    const ordersCount = await Order.countDocuments({
      "shippingDetails.zoneId": zone._id,
    });

    if (ordersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete zone. It has ${ordersCount} order(s) associated with it. Consider disabling it instead.`,
      });
    }

    await ShippingZone.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Shipping zone deleted successfully",
    });
  } catch (error) {
    console.error("Delete zone error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete zone",
      error: error.message,
    });
  }
};

// Check if delivery is available for a city
exports.checkAvailability = async (req, res) => {
  try {
    let { city, country } = req.query;

    console.log(
      `[CHECK AVAILABILITY] Received request - city: "${city}", country: "${country}"`,
    );

    if (!city || !country) {
      console.log(`[CHECK AVAILABILITY] Missing city or country`);
      return res.status(400).json({
        success: false,
        message: "City and country are required",
      });
    }

    // Normalize country code to full name
    country = normalizeCountry(country);
    console.log(`[CHECK AVAILABILITY] Normalized country to: "${country}"`);

    // Find matching zone with multi-layer approach
    const zones = await ShippingZone.find({ isActive: true }).sort({
      priority: 1, // Lower priority number = higher priority
    });

    console.log(`[CHECK AVAILABILITY] Found ${zones.length} active zones`);

    let matchedZone = null;

    // LAYER 1: Try to find zone by exact city match
    for (const zone of zones) {
      if (
        zone.matchesCity(city) &&
        zone.country.toLowerCase() === country.toLowerCase()
      ) {
        console.log(
          `[CHECK AVAILABILITY] ✓ LAYER 1 - Exact city match: ${zone.name}`,
        );
        matchedZone = zone;
        break;
      }
    }

    // LAYER 2: Try province-based match if no city match found
    if (!matchedZone) {
      const detectedProvince = detectProvince(city);
      if (detectedProvince) {
        console.log(
          `[CHECK AVAILABILITY] LAYER 2 - Detected province: ${detectedProvince}`,
        );

        for (const zone of zones) {
          // Check if zone has province field and matches
          if (
            zone.province &&
            zone.province.toLowerCase() === detectedProvince.toLowerCase() &&
            zone.country.toLowerCase() === country.toLowerCase()
          ) {
            console.log(
              `[CHECK AVAILABILITY] ✓ LAYER 2 - Province match: ${zone.name} (${zone.province})`,
            );
            matchedZone = zone;
            break;
          }

          // Also check if zone name includes province (fallback)
          if (
            !zone.province &&
            zone.name.toLowerCase().includes(detectedProvince.toLowerCase()) &&
            zone.country.toLowerCase() === country.toLowerCase()
          ) {
            console.log(
              `[CHECK AVAILABILITY] ✓ LAYER 2 - Zone name includes province: ${zone.name}`,
            );
            matchedZone = zone;
            break;
          }
        }
      } else {
        console.log(
          `[CHECK AVAILABILITY] LAYER 2 - No province detected for "${city}"`,
        );
      }
    }

    // LAYER 3: Use default/remote zone as fallback
    if (!matchedZone) {
      console.log(`[CHECK AVAILABILITY] LAYER 3 - Looking for default zone`);
      matchedZone = await ShippingZone.findOne({
        isDefault: true,
        isActive: true,
      });
      if (matchedZone) {
        console.log(
          `[CHECK AVAILABILITY] ✓ LAYER 3 - Using default zone: ${matchedZone.name}`,
        );
      } else {
        console.log(`[CHECK AVAILABILITY] No default zone found`);
      }
    }

    if (!matchedZone) {
      console.log(`[CHECK AVAILABILITY] ✗ No zone available`);
      return res.json({
        success: false,
        available: false,
        message: "Delivery not available in this area",
      });
    }

    console.log(
      `[CHECK AVAILABILITY] ✓ Success - returning zone: ${matchedZone.name}`,
    );
    return res.json({
      success: true,
      available: true,
      zoneName: matchedZone.name,
      deliveryTime: `${matchedZone.deliveryTimeMin}-${matchedZone.deliveryTimeMax} days`,
      message: matchedZone.isDefault
        ? "Delivery available (remote area)"
        : "Delivery available",
    });
  } catch (error) {
    console.error("Check availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check availability",
      error: error.message,
    });
  }
};
