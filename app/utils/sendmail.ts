"use server";

import nodemailer from "nodemailer";

export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    const mailOptions = {
      from: `"Vial Podcast" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Vial — intentional listening begins",
      html: `
        <div style="background-color:#0a0a0a; padding:2rem; font-family:Inter, Arial, sans-serif;">
          <div style="max-width:640px; margin:0 auto; background-color:#0f0f0f; border-radius:1rem; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.6); border:1px solid #1f1f1f;">
            
            <!-- Header -->
            <div style="padding:1.75rem; text-align:center; border-bottom:1px solid #1f1f1f;">
              <h1 style="font-size:1.75rem; font-weight:300; margin:0; color:#e5e5e5; letter-spacing:0.15em;">
                V I A L
              </h1>
              <p style="margin-top:0.5rem; font-size:0.85rem; color:#9ca3af;">
                A single-host podcast for intentional listening
              </p>
            </div>

            <!-- Body -->
            <div style="padding:2rem; text-align:left;">
              <h2 style="font-size:1.15rem; font-weight:500; color:#e5e5e5; margin-bottom:0.75rem;">
                Welcome${name ? `, ${name}` : ``},
              </h2>

              <p style="color:#d1d5db; font-size:0.95rem; line-height:1.7;">
                Thank you for joining Vial. You now have access to our complete library of episodes, 
                each designed for intentional listening and deep reflection.
              </p>

              <div style="margin:2.25rem 0; text-align:center;">
                <a href="${
                  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                }/subscriber"
                  style="
                    display:inline-block;
                    background:#a3e635;
                    color:#000000;
                    text-decoration:none;
                    font-weight:600;
                    padding:0.75rem 1.75rem;
                    border-radius:9999px;
                    font-size:0.9rem;
                  ">
                  Begin Listening
                </a>
              </div>

              <p style="color:#9ca3af; font-size:0.9rem; line-height:1.6; margin-top:1.25rem;">
                If you have any questions, simply reply to this email. We're here to help.
              </p>
            </div>
          </div>

          <!-- Legal Footer -->
          <p style="text-align:center; color:#525252; font-size:0.75rem; margin-top:1.5rem;">
            © ${new Date().getFullYear()} Vial. All rights reserved.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    return { success: false, error: error.message };
  }
};

// Background email sending function that doesn't block the response
// export const sendWelcomeEmailBackground = async (
//   email: string,
//   name: string
// ) => {
//   // Don't wait for email to send, just start it
//   sendWelcomeEmail(email, name)
//     .then((result) => {
//       if (result.success) {
//         console.log(`✅ Background email sent successfully to ${email}`);
//       } else {
//         console.error(`❌ Background email failed for ${email}:`, result.error);
//       }
//     })
//     .catch((error) => {
//       console.error(`❌ Background email error for ${email}:`, error);
//     });

//   return { success: true, message: "Email sending initiated" };
// };
