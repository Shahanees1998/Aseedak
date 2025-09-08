import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@aseedak.com',
    to: email,
    subject: 'Reset Your Aseedak Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Aseedak</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Word Elimination Game</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #666; line-height: 1.6;">
            You requested to reset your password for your Aseedak account. Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block; 
                      font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #667eea; word-break: break-all; font-size: 14px;">
            ${resetUrl}
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
          </p>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 14px;">
            © 2024 Aseedak. All rights reserved.
          </p>
        </div>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Password reset email sent successfully')
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw error
  }
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@aseedak.com',
    to: email,
    subject: 'Welcome to Aseedak!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Aseedak</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Word Elimination Game</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">Welcome to Aseedak, ${firstName}!</h2>
          <p style="color: #666; line-height: 1.6;">
            You've successfully joined the ultimate word elimination game! Get ready to:
          </p>
          
          <ul style="color: #666; line-height: 1.8;">
            <li>Join multiplayer rooms with up to 8 players</li>
            <li>Guess words to eliminate your targets</li>
            <li>Experience real-time gameplay</li>
            <li>Track your statistics and achievements</li>
            <li>Choose from various avatars</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block; 
                      font-weight: bold;">
              Start Playing Now!
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If you have any questions, feel free to contact our support team.
          </p>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 14px;">
            © 2024 Aseedak. All rights reserved.
          </p>
        </div>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Welcome email sent successfully')
  } catch (error) {
    console.error('Error sending welcome email:', error)
    throw error
  }
}