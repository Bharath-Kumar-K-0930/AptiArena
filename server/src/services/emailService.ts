import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendVerificationEmail = async (to: string, token: string) => {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Verify your AptiArena Account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #008080;">Welcome to AptiArena!</h2>
                <p>Please verify your email address to activate your account.</p>
                <div style="margin: 20px 0;">
                    <a href="${verificationUrl}" style="background-color: #008080; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
                </div>
                <p>Or click this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
                <p>If you didn't create an account, please ignore this email.</p>
            </div>
        `,
    };

    try {
        await transporter.verify(); // Check connection configuration
        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent SUCCESSFULLY to ${to}`);
    } catch (error: any) {
        console.error('❌ EMAIL SENDING FAILED:', error);
        if (error.response) {
            console.error('SMTP Response:', error.response);
        }
        // Don't throw to prevent crashing, just log it.
        // potentially return false to controller to notify client
        throw new Error('Could not send verification email: ' + error.message);
    }
};
