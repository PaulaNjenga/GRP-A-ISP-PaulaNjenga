import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter
const createTransporter = () => {
  // In development, use Ethereal (fake SMTP)
  // In production, use real SMTP service (Gmail, SendGrid, etc.)
  
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Log emails to console
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'test123',
      },
    });
  }
};

// Generate verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate password reset token
export const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hashedToken };
};

// Send verification email
export const sendVerificationEmail = async (user, token) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
  
  const mailOptions = {
    from: `"FemiHealth" <${process.env.SMTP_FROM || 'noreply@femihealth.com'}>`,
    to: user.email,
    subject: 'Verify Your Email - FemiHealth',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to FemiHealth! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.name},</h2>
            <p>Thank you for registering with FemiHealth. We're excited to have you on board!</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with FemiHealth, please ignore this email.</p>
            <p>Best regards,<br>The FemiHealth Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FemiHealth. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to FemiHealth!
      
      Hi ${user.name},
      
      Thank you for registering with FemiHealth. Please verify your email address by visiting:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with FemiHealth, please ignore this email.
      
      Best regards,
      The FemiHealth Team
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    
    // In development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('Verification URL:', verificationUrl);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (user, token) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
  
  const mailOptions = {
    from: `"FemiHealth" <${process.env.SMTP_FROM || 'noreply@femihealth.com'}>`,
    to: user.email,
    subject: 'Password Reset Request - FemiHealth',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request 🔐</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.name},</h2>
            <p>We received a request to reset your password for your FemiHealth account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in 15 minutes</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
              </ul>
            </div>
            <p>For security reasons, we recommend:</p>
            <ul>
              <li>Using a strong, unique password</li>
              <li>Enabling two-factor authentication</li>
              <li>Not sharing your password with anyone</li>
            </ul>
            <p>Best regards,<br>The FemiHealth Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FemiHealth. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hi ${user.name},
      
      We received a request to reset your password for your FemiHealth account.
      
      Reset your password by visiting:
      ${resetUrl}
      
      This link will expire in 15 minutes.
      
      If you didn't request this, please ignore this email. Your password will remain unchanged.
      
      Best regards,
      The FemiHealth Team
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    
    // In development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('Reset URL:', resetUrl);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send welcome email (after verification)
export const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();
  
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
  
  const mailOptions = {
    from: `"FemiHealth" <${process.env.SMTP_FROM || 'noreply@femihealth.com'}>`,
    to: user.email,
    subject: 'Welcome to FemiHealth! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Account is Ready! 🎉</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${user.name}!</h2>
            <p>Your email has been verified and your account is now active. You're all set to start using FemiHealth!</p>
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
            </div>
            
            <h3>What you can do now:</h3>
            <div class="feature">
              <strong>📊 PCOS Risk Assessment</strong><br>
              Complete our comprehensive assessment to understand your PCOS risk
            </div>
            <div class="feature">
              <strong>📈 Track Your Health</strong><br>
              Monitor your symptoms and health metrics over time
            </div>
            <div class="feature">
              <strong>👩‍⚕️ Connect with Doctors</strong><br>
              Get professional medical advice and review of your results
            </div>
            <div class="feature">
              <strong>📚 Learn More</strong><br>
              Access educational resources about PCOS and women's health
            </div>
            
            <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
            
            <p>Best regards,<br>The FemiHealth Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FemiHealth. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to FemiHealth!
      
      Hi ${user.name},
      
      Your email has been verified and your account is now active!
      
      Visit your dashboard: ${dashboardUrl}
      
      What you can do now:
      - Complete PCOS risk assessment
      - Track your health metrics
      - Connect with doctors
      - Access educational resources
      
      Best regards,
      The FemiHealth Team
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email - it's not critical
    return { success: false, error: error.message };
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  generateVerificationToken,
  generateResetToken,
};
