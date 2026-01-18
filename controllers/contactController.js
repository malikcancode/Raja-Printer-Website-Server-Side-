const { sendContactEmail } = require("../config/email");

// Send contact form message
const sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required",
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
    const result = await sendContactEmail({
      name,
      email,
      phone: phone || "Not provided",
      subject: subject || "General Inquiry",
      message,
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        message:
          "Your message has been sent successfully. We will get back to you soon!",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send message. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later.",
    });
  }
};

module.exports = {
  sendContactMessage,
};
