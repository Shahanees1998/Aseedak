import sgMail from '@sendgrid/mail'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
  
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@aseedak.com',
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
    await sgMail.send(msg)
    console.log('Password reset email sent successfully')
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw error
  }
}

export async function sendOTPEmail(email: string, firstName: string, otp: string) {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@aseedak.com',
    subject: 'Verify Your Aseedak Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Aseedak</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Word Elimination Game</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${firstName},<br><br>
            Welcome to Aseedak! To complete your account setup, please verify your email address using the OTP below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #667eea; color: white; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px; display: inline-block;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This OTP will expire in 10 minutes. If you didn't create an account with Aseedak, please ignore this email.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              Enter this code in the verification page to activate your account.
            </p>
          </div>
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
    await sgMail.send(msg)
    console.log('OTP email sent successfully')
  } catch (error) {
    console.error('Error sending OTP email:', error)
    throw error
  }
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@aseedak.com',
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
    await sgMail.send(msg)
    console.log('Welcome email sent successfully')
  } catch (error) {
    console.error('Error sending welcome email:', error)
    throw error
  }
}

export async function sendGameRoomInvitationEmail(
  email: string, 
  firstName: string, 
  roomName: string, 
  roomCode: string, 
  creatorName: string,
  difficulty: string,
  maxPlayers: number
) {
  const gameUrl = `${process.env.NEXTAUTH_URL}/game/${roomCode}`
  
  // Check if SendGrid is properly configured
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not configured')
    throw new Error('Email service not configured')
  }
  
  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.error('SENDGRID_FROM_EMAIL is not configured')
    throw new Error('From email not configured')
  }
  
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `🎮 You're invited to join "${roomName}" - Aseedak Game Room`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎮 Aseedak</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Word Elimination Game</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">You're Invited to a Game Room!</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${firstName},<br><br>
            <strong>${creatorName}</strong> has invited you to join their game room "<strong>${roomName}</strong>" on Aseedak!
          </p>
          
          <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0; text-align: center;">Game Room Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
              <div style="text-align: center;">
                <strong style="color: #667eea;">Room Name</strong><br>
                <span style="color: #666;">${roomName}</span>
              </div>
              <div style="text-align: center;">
                <strong style="color: #667eea;">Room Code</strong><br>
                <span style="color: #333; font-family: monospace; font-size: 18px; font-weight: bold;">${roomCode}</span>
              </div>
              <div style="text-align: center;">
                <strong style="color: #667eea;">Difficulty</strong><br>
                <span style="color: #666; text-transform: capitalize;">${difficulty}</span>
              </div>
              <div style="text-align: center;">
                <strong style="color: #667eea;">Max Players</strong><br>
                <span style="color: #666;">${maxPlayers}</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${gameUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block; 
                      font-weight: bold; 
                      font-size: 16px;">
              🎮 Join Game Room Now!
            </a>
          </div>
          
          <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
            <p style="color: #1976d2; margin: 0; font-size: 14px;">
              <strong>💡 Tip:</strong> You can also join by entering the room code "${roomCode}" in the Aseedak app.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This invitation was sent by ${creatorName}. If you didn't expect this invitation, you can safely ignore this email.
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
    await sgMail.send(msg)
    console.log(`✅ Game room invitation email sent successfully to ${email}`)
  } catch (error: any) {
    console.error(`❌ Failed to send invitation email to ${email}:`, error)
    
    // Log detailed SendGrid error information
    if (error.response) {
      console.error('SendGrid Response Status:', error.response.status)
      console.error('SendGrid Response Headers:', error.response.headers)
      console.error('SendGrid Response Body:', error.response.body)
    }
    
    // Don't throw the error to prevent room creation from failing
    console.error(`Email sending failed for ${email}, but room creation will continue`)
  }
}