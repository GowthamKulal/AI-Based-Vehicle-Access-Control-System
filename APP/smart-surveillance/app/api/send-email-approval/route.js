import nodemailer from "nodemailer";
import { format } from "date-fns";

export async function POST(request) {
  try {
    const approvalData = await request.json();
    
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your app password
      },
    });

    // Format dates for display
    const fromDate = format(new Date(approvalData.authorizationTill.from), "EEEE, MMMM dd, yyyy");
    const toDate = format(new Date(approvalData.authorizationTill.to), "EEEE, MMMM dd, yyyy");
    
    // Generate QR code URL or access code if available
    const accessInfo = approvalData.accessCode 
      ? `<p><strong>Your Access Code:</strong> <span style="font-size: 18px; font-weight: bold; color: #1a56db;">${approvalData.accessCode}</span></p>`
      : '';

    // Email content for visitor
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: approvalData.email, // Visitor's email address
      subject: `Vehicle Access Approved - ${approvalData.plate}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              background-color: #1a56db;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              padding: 20px;
              border: 1px solid #ddd;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            .info-block {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
            .important {
              color: #1a56db;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Vehicle Access Approved</h1>
          </div>
          <div class="content">
            <p>Dear ${approvalData.name},</p>
            
            <p>We're pleased to inform you that your vehicle registration request has been <span class="important">approved</span>.</p>
            
            <div class="info-block">
              <h3>Your Registration Details:</h3>
              <p><strong>Name:</strong> ${approvalData.name}</p>
              <p><strong>License Plate:</strong> ${approvalData.plate}</p>
              <p><strong>Vehicle Type:</strong> ${approvalData.vehicleType}</p>
              <p><strong>Access Period:</strong> ${fromDate} to ${toDate}</p>
              ${accessInfo}
            </div>
            
            <h3>Important Information:</h3>
            <ul>
              <li>Please have your ID ready upon arrival for verification</li>
              <li>Follow all parking and traffic regulations while on premises</li>
              <li>Contact security at ${process.env.SECURITY_PHONE || "(555) 123-4567"} if you require assistance</li>
            </ul>
            
            <p>You stated your reason for visit as:</p>
            <div class="info-block">
              <em>${approvalData.reason}</em>
            </div>
            
            <p>If you have any questions or need to make changes to your registration, please contact our administrative office.</p>
            
            <p>Thank you for your cooperation.</p>
            
            <p>Best regards,<br>
            Smart Surveillance System</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Smart Surveillance System</p>
          </div>
        </body>
        </html>
      `,
    };

    // Send the email to visitor
    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Approval email sending failed:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
