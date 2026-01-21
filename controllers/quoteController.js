const { sendQuoteEmail } = require("../config/email");

// Send quote request
const sendQuoteRequest = async (req, res) => {
  try {
    const {
      businessName,
      contactPerson,
      phone,
      email,
      city,
      requirement,
      message,
    } = req.body;

    // Validate required fields
    if (
      !businessName ||
      !contactPerson ||
      !phone ||
      !email ||
      !city ||
      !requirement
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Business name, contact person, phone, email, city, and requirement are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Send email
    const result = await sendQuoteEmail({
      businessName,
      contactPerson,
      phone,
      email,
      city,
      requirement,
      message: message || "Not provided",
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        message:
          "Your quote request has been sent successfully. We will contact you soon!",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send quote request. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Quote request error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later.",
    });
  }
};

module.exports = {
  sendQuoteRequest,
};
