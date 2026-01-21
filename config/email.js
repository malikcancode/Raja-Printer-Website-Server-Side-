const nodemailer = require("nodemailer");

// Create transporter with Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Company info for email templates
const companyInfo = {
  name: "CopyTech.pk",
  email: process.env.EMAIL_USER || "copytech1966@gmail.com",
  adminEmail: process.env.EMAIL_USER || "copytech1966@gmail.com",
  phone: "+92 317-5223143",
  address: "Lahore, Pakistan",
  website: process.env.FRONTEND_URL || "http://localhost:3000",
};

// Email template styles
const emailStyles = `
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
    .header p { color: #dbeafe; margin: 10px 0 0; font-size: 14px; }
    .content { padding: 30px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
    .order-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .order-number { font-size: 14px; color: #64748b; margin-bottom: 5px; }
    .order-id { font-size: 20px; font-weight: bold; color: #1e3a8a; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; text-transform: uppercase; }
    .status-pending { background-color: #fef3c7; color: #92400e; }
    .status-processing { background-color: #dbeafe; color: #1e40af; }
    .status-shipped { background-color: #e9d5ff; color: #7c3aed; }
    .status-delivered { background-color: #d1fae5; color: #065f46; }
    .status-cancelled { background-color: #fee2e2; color: #991b1b; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th { background-color: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    .items-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .item-image { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
    .item-name { font-weight: 600; color: #1f2937; }
    .item-qty { color: #64748b; }
    .item-price { font-weight: bold; color: #1e3a8a; }
    .totals { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.grand { border-top: 2px solid #e2e8f0; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: bold; color: #059669; }
    .address-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .address-title { font-weight: bold; color: #166534; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
    .footer { background-color: #1f2937; padding: 30px; text-align: center; color: #9ca3af; }
    .footer a { color: #60a5fa; text-decoration: none; }
    .footer p { margin: 5px 0; font-size: 13px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .divider { height: 1px; background-color: #e2e8f0; margin: 20px 0; }
  </style>
`;

// Generate order items HTML
const generateItemsHtml = (items) => {
  return items
    .map(
      (item) => `
    <tr>
      <td>
        <img src="${item.image}" alt="${item.name}" class="item-image" />
      </td>
      <td>
        <div class="item-name">${item.name}</div>
        <div class="item-qty">Qty: ${item.quantity}</div>
      </td>
      <td class="item-price">PKR ${item.price.toLocaleString()}</td>
      <td class="item-price">PKR ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `,
    )
    .join("");
};

// Order Confirmation Email Template
const orderConfirmationTemplate = (order) => {
  const statusClass = `status-${order.status.toLowerCase()}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Order Confirmed!</h1>
          <p>Thank you for shopping with ${companyInfo.name}</p>
        </div>
        
        <div class="content">
          <p class="greeting">Dear ${order.customerName},</p>
          <p>Thank you for your order! We're excited to let you know that we've received your order and it's being processed.</p>
          
          <div class="order-box">
            <div class="order-number">Order Number</div>
            <div class="order-id">#${order.orderNumber || order._id}</div>
            <div style="margin-top: 15px;">
              <span class="${statusClass} status-badge">${order.status}</span>
            </div>
          </div>

          <h3 style="color: #1f2937; margin-bottom: 10px;">📦 Order Items</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${generateItemsHtml(order.items)}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>PKR ${order.itemsPrice.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Shipping:</span>
              <span>PKR ${order.shippingPrice.toLocaleString()}</span>
            </div>
            ${
              order.taxPrice > 0
                ? `
            <div class="total-row">
              <span>Tax:</span>
              <span>PKR ${order.taxPrice.toLocaleString()}</span>
            </div>
            `
                : ""
            }
            <div class="total-row grand">
              <span>Total:</span>
              <span>PKR ${order.totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div class="address-box">
            <div class="address-title">📍 Shipping Address</div>
            <p style="margin: 0; color: #374151;">
              ${order.shippingAddress.addressLine1}<br>
              ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + "<br>" : ""}
              ${order.shippingAddress.city}${order.shippingAddress.state ? ", " + order.shippingAddress.state : ""}<br>
              ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}
            </p>
          </div>

          <div class="divider"></div>

          <p style="color: #64748b; font-size: 14px;">
            We'll send you another email when your order ships. If you have any questions, feel free to contact us.
          </p>

          <center>
            <a href="${companyInfo.website}/#/shop" class="cta-button">Continue Shopping</a>
          </center>
        </div>

        <div class="footer">
          <p><strong>${companyInfo.name}</strong></p>
          <p>📞 ${companyInfo.phone} | ✉️ <a href="mailto:${companyInfo.email}">${companyInfo.email}</a></p>
          <p>${companyInfo.address}</p>
          <p style="margin-top: 15px; font-size: 11px; color: #6b7280;">
            This email was sent to ${order.customerEmail} because you placed an order on our website.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Order Status Update Email Template
const orderStatusUpdateTemplate = (order, previousStatus) => {
  const statusClass = `status-${order.status.toLowerCase()}`;

  const statusMessages = {
    processing: "Great news! Your order is now being prepared for shipment.",
    shipped:
      "Your order is on its way! It has been handed over to our delivery partner.",
    delivered:
      "Your order has been delivered successfully! We hope you love your purchase.",
    cancelled: "We're sorry to inform you that your order has been cancelled.",
  };

  const statusEmoji = {
    pending: "⏳",
    processing: "📦",
    shipped: "🚚",
    delivered: "✅",
    cancelled: "❌",
  };

  const message =
    statusMessages[order.status.toLowerCase()] ||
    "Your order status has been updated.";
  const emoji = statusEmoji[order.status.toLowerCase()] || "📋";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${emoji} Order Status Update</h1>
          <p>Your order status has changed</p>
        </div>
        
        <div class="content">
          <p class="greeting">Dear ${order.customerName},</p>
          <p>${message}</p>
          
          <div class="order-box">
            <div class="order-number">Order Number</div>
            <div class="order-id">#${order.orderNumber || order._id}</div>
            <div style="margin-top: 15px;">
              <span style="color: #64748b; font-size: 14px;">Status updated from </span>
              <span style="text-decoration: line-through; color: #9ca3af;">${previousStatus}</span>
              <span style="color: #64748b; font-size: 14px;"> to </span>
              <span class="${statusClass} status-badge">${order.status}</span>
            </div>
          </div>

          <h3 style="color: #1f2937; margin-bottom: 10px;">📦 Order Summary</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${generateItemsHtml(order.items)}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row grand">
              <span>Order Total:</span>
              <span>PKR ${order.totalPrice.toLocaleString()}</span>
            </div>
          </div>

          ${
            order.status.toLowerCase() === "shipped"
              ? `
          <div class="address-box">
            <div class="address-title">📍 Delivering To</div>
            <p style="margin: 0; color: #374151;">
              ${order.shippingAddress.addressLine1}<br>
              ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + "<br>" : ""}
              ${order.shippingAddress.city}${order.shippingAddress.state ? ", " + order.shippingAddress.state : ""}<br>
              ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}
            </p>
          </div>
          `
              : ""
          }

          <div class="divider"></div>

          <p style="color: #64748b; font-size: 14px;">
            If you have any questions about your order, please don't hesitate to contact us.
          </p>

          <center>
            <a href="mailto:${companyInfo.email}" class="cta-button">Contact Support</a>
          </center>
        </div>

        <div class="footer">
          <p><strong>${companyInfo.name}</strong></p>
          <p>📞 ${companyInfo.phone} | ✉️ <a href="mailto:${companyInfo.email}">${companyInfo.email}</a></p>
          <p>${companyInfo.address}</p>
          <p style="margin-top: 15px; font-size: 11px; color: #6b7280;">
            This email was sent to ${order.customerEmail} regarding your order #${order.orderNumber || order._id}.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Admin New Order Notification Template
const adminNewOrderTemplate = (order) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
          <h1>🔔 New Order Received!</h1>
          <p>A new order has been placed on your store</p>
        </div>
        
        <div class="content">
          <div class="order-box">
            <div class="order-number">Order Number</div>
            <div class="order-id">#${order.orderNumber || order._id}</div>
            <div style="margin-top: 10px; color: #64748b;">
              Placed on ${new Date(order.createdAt).toLocaleString()}
            </div>
          </div>

          <h3 style="color: #1f2937;">👤 Customer Details</h3>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${order.customerName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${order.customerEmail}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.customerPhone || "Not provided"}</p>
          </div>

          <h3 style="color: #1f2937;">📦 Order Items</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${generateItemsHtml(order.items)}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>PKR ${order.itemsPrice.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Shipping:</span>
              <span>PKR ${order.shippingPrice.toLocaleString()}</span>
            </div>
            <div class="total-row grand">
              <span>Total:</span>
              <span>PKR ${order.totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div class="address-box">
            <div class="address-title">📍 Shipping Address</div>
            <p style="margin: 0; color: #374151;">
              ${order.shippingAddress.addressLine1}<br>
              ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + "<br>" : ""}
              ${order.shippingAddress.city}${order.shippingAddress.state ? ", " + order.shippingAddress.state : ""}<br>
              ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}
            </p>
          </div>

          <center>
            <a href="${companyInfo.website}/#/admin/orders" class="cta-button">View in Admin Panel</a>
          </center>
        </div>

        <div class="footer">
          <p><strong>${companyInfo.name} - Admin Notification</strong></p>
          <p style="font-size: 11px; color: #6b7280;">
            This is an automated notification for new orders.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send order confirmation email to customer
const sendOrderConfirmation = async (order) => {
  try {
    const mailOptions = {
      from: `"${companyInfo.name}" <${companyInfo.email}>`,
      to: order.customerEmail,
      subject: `Order Confirmed! #${order.orderNumber || order._id} - ${companyInfo.name}`,
      html: orderConfirmationTemplate(order),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Order confirmation email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return { success: false, error: error.message };
  }
};

// Send order status update email to customer
const sendOrderStatusUpdate = async (order, previousStatus) => {
  try {
    const statusEmoji = {
      processing: "📦",
      shipped: "🚚",
      delivered: "✅",
      cancelled: "❌",
    };
    const emoji = statusEmoji[order.status.toLowerCase()] || "📋";

    const mailOptions = {
      from: `"${companyInfo.name}" <${companyInfo.email}>`,
      to: order.customerEmail,
      subject: `${emoji} Order ${order.status} - #${order.orderNumber || order._id}`,
      html: orderStatusUpdateTemplate(order, previousStatus),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Order status update email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending order status update email:", error);
    return { success: false, error: error.message };
  }
};

// Send new order notification to admin
const sendAdminNewOrderNotification = async (order) => {
  try {
    const mailOptions = {
      from: `"${companyInfo.name}" <${companyInfo.email}>`,
      to: companyInfo.adminEmail,
      subject: `🔔 New Order #${order.orderNumber || order._id} - PKR ${order.totalPrice.toLocaleString()}`,
      html: adminNewOrderTemplate(order),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Admin notification email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending admin notification email:", error);
    return { success: false, error: error.message };
  }
};

// Contact form email template
const contactEmailTemplate = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">📬 New Contact Message</h1>
          <p style="color: #dbeafe; margin: 10px 0 0; font-size: 14px;">Someone reached out through the website</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 16px;">Contact Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;"><strong>Name:</strong></td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;"><a href="mailto:${data.email}" style="color: #3b82f6;">${data.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>Phone:</strong></td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>Subject:</strong></td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.subject}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 16px;">💬 Message</h3>
            <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
          </div>

          <div style="margin-top: 20px; text-align: center;">
            <a href="mailto:${data.email}?subject=Re: ${data.subject}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Reply to ${data.name}</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #1e293b; padding: 20px; text-align: center;">
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">This message was sent from the CopyTech.pk website contact form</p>
          <p style="color: #64748b; margin: 10px 0 0; font-size: 11px;">© ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send contact form email to admin
const sendContactEmail = async (data) => {
  try {
    const mailOptions = {
      from: `"${data.name}" <${companyInfo.email}>`,
      replyTo: data.email,
      to: companyInfo.adminEmail,
      subject: `📬 Contact Form: ${data.subject} - from ${data.name}`,
      html: contactEmailTemplate(data),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Contact form email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending contact form email:", error);
    return { success: false, error: error.message };
  }
};

// Quote Request Email Template
const quoteEmailTemplate = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">💼 New B2B Quote Request</h1>
          <p style="color: #dbeafe; margin: 10px 0 0; font-size: 14px;">A business is requesting a quote</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e40af; font-weight: bold; font-size: 14px;">🏢 Business Information</p>
          </div>

          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 40%;"><strong>Business Name:</strong></td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.businessName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>Contact Person:</strong></td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.contactPerson}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;"><a href="mailto:${data.email}" style="color: #3b82f6;">${data.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>Phone:</strong></td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>City:</strong></td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.city}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fefce8; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 16px;">📋 Requirements</h3>
            <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.requirement}</p>
          </div>

          ${
            data.message && data.message !== "Not provided"
              ? `
          <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #166534; font-size: 16px;">💬 Additional Message</h3>
            <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
          </div>
          `
              : ""
          }

          <div style="margin-top: 25px; text-align: center;">
            <a href="mailto:${data.email}?subject=Quote for ${data.businessName}" style="display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Reply with Quote</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #1e293b; padding: 20px; text-align: center;">
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">This quote request was sent from the CopyTech.pk website</p>
          <p style="color: #64748b; margin: 10px 0 0; font-size: 11px;">© ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send quote request email to admin
const sendQuoteEmail = async (data) => {
  try {
    const mailOptions = {
      from: `"${data.businessName}" <${companyInfo.email}>`,
      replyTo: data.email,
      to: companyInfo.adminEmail,
      subject: `💼 B2B Quote Request from ${data.businessName} - ${data.contactPerson}`,
      html: quoteEmailTemplate(data),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Quote request email sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending quote request email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  transporter,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendAdminNewOrderNotification,
  sendContactEmail,
  sendQuoteEmail,
};
