const Newsletter = require("../models/Newsletter");
const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Newsletter Welcome Email Template
const newsletterWelcomeTemplate = (email) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; }
        .header p { color: #dbeafe; margin: 15px 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
        .text { color: #4b5563; line-height: 1.8; margin: 15px 0; }
        .benefits { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
        .benefits h3 { color: #1e3a8a; margin-top: 0; }
        .benefits ul { margin: 15px 0; padding-left: 20px; }
        .benefits li { color: #4b5563; margin: 10px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 25px 0; }
        .footer { background-color: #1f2937; padding: 30px; text-align: center; color: #9ca3af; }
        .footer a { color: #60a5fa; text-decoration: none; }
        .footer p { margin: 8px 0; font-size: 14px; }
        .social-icons { margin: 20px 0; }
        .social-icons a { display: inline-block; margin: 0 10px; color: #60a5fa; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to CopyTech.pk!</h1>
          <p>Thank you for subscribing to our newsletter</p>
        </div>
        
        <div class="content">
          <p class="greeting">Hello!</p>
          
          <p class="text">
            We're thrilled to have you join our community of printing solutions enthusiasts! 
            You've successfully subscribed to the CopyTech.pk newsletter.
          </p>
          
          <div class="benefits">
            <h3>📬 What to Expect:</h3>
            <ul>
              <li>🔥 <strong>Exclusive Deals:</strong> Be the first to know about special discounts and hot offers</li>
              <li>🆕 <strong>New Products:</strong> Get updates on the latest printing technology and equipment</li>
              <li>💡 <strong>Expert Tips:</strong> Learn maintenance tips and best practices for your office equipment</li>
              <li>🎁 <strong>Special Promotions:</strong> Access member-only bundle offers and seasonal sales</li>
            </ul>
          </div>
          
          <p class="text">
            We promise to send you only valuable content and never spam your inbox. 
            You can unsubscribe at any time from the link at the bottom of our emails.
          </p>
          
          <center>
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/shop" class="cta-button">
              Start Shopping Now
            </a>
          </center>
          
          <p class="text" style="margin-top: 30px;">
            Have questions? Feel free to reach out to us at 
            <a href="mailto:copytech1966@gmail.com" style="color: #3b82f6;">copytech1966@gmail.com</a> 
            or call us at <strong>0317-5223143</strong> / <strong>051-6059089</strong>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>CopyTech.pk</strong></p>
          <p>Your Trusted Partner for Premium Printing Solutions</p>
          <p>Lahore, Pakistan</p>
          
          <div class="social-icons">
            <a href="#">Facebook</a> | 
            <a href="#">Twitter</a> | 
            <a href="#">Instagram</a>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
            You're receiving this email because you subscribed to our newsletter.<br>
            © ${new Date().getFullYear()} CopyTech.pk. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send welcome email
const sendWelcomeEmail = async (email) => {
  try {
    await transporter.sendMail({
      from: `"CopyTech.pk" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Welcome to CopyTech.pk Newsletter!",
      html: newsletterWelcomeTemplate(email),
    });
    console.log(`✅ Welcome email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error);
    return false;
  }
};

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({
          success: false,
          message: "This email is already subscribed to our newsletter",
        });
      } else {
        // Reactivate subscription
        existingSubscriber.isActive = true;
        existingSubscriber.subscribedAt = new Date();
        existingSubscriber.unsubscribedAt = null;
        await existingSubscriber.save();

        // Send welcome back email
        await sendWelcomeEmail(email);

        return res.status(200).json({
          success: true,
          message: "Welcome back! Your subscription has been reactivated.",
        });
      }
    }

    // Create new subscriber
    const newSubscriber = await Newsletter.create({ email });

    // Send welcome email
    await sendWelcomeEmail(email);

    res.status(201).json({
      success: true,
      message: "Successfully subscribed! Thank you for joining our newsletter.",
      data: {
        email: newSubscriber.email,
        subscribedAt: newSubscriber.subscribedAt,
      },
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to subscribe. Please try again later.",
    });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const subscriber = await Newsletter.findOne({ email });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Email not found in our newsletter list",
      });
    }

    if (!subscriber.isActive) {
      return res.status(400).json({
        success: false,
        message: "This email is already unsubscribed",
      });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: "Successfully unsubscribed from newsletter",
    });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unsubscribe. Please try again later.",
    });
  }
};

// Get all subscribers (Admin only)
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true })
      .select("email subscribedAt")
      .sort({ subscribedAt: -1 });

    res.status(200).json({
      success: true,
      count: subscribers.length,
      data: subscribers,
    });
  } catch (error) {
    console.error("Get subscribers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscribers",
    });
  }
};
