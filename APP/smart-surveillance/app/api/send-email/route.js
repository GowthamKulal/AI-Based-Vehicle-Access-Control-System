import nodemailer from "nodemailer";
import { format } from "date-fns";

export async function POST(request) {
  try {
    const formData = await request.json();

    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail address
        pass: process.env.EMAIL_PASS, // App password
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NEXT_PUBLIC_ADMIN_EMAIL, // Admin's email address
      subject: `New Vehicle Registration Request: ${formData.plate}`,
      html: `
        <h1>New Vehicle Registration Request</h1>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <h2>Visitor Information:</h2>
        <ul>
          <li><strong>Name:</strong> ${formData.name}</li>
          <li><strong>Phone:</strong> ${formData.phone}</li>
          <li><strong>License Plate:</strong> ${formData.plate}</li>
          <li><strong>Vehicle Type:</strong> ${formData.vehicleType}</li>
          <li><strong>Required from: </strong>${format(
            formData.authorizationTill.from,
            "LLL dd, y"
          )} 
          <strong>till: </strong>${format(
            formData.authorizationTill.to,
            "LLL dd, y"
          )}</li>
        </ul>
        <h2>Visit Reason:</h2>
        <p>${formData.reason}</p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Email sending failed:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
