import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (to: string, token: string) => {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    try {
        const { data, error } = await resend.emails.send({
            from: 'AptiArena <onboarding@resend.dev>', // Use 'onboarding@resend.dev' for testing if no custom domain
            to: [to],
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
        });

        if (error) {
            console.error('❌ RESEND EMAIL ERROR:', error);
            throw new Error(error.message);
        }

        console.log(`✅ Verification email sent SUCCESSFULLY to ${to} (ID: ${data?.id})`);
    } catch (error: any) {
        console.error('❌ EMAIL SENDING FAILED:', error);
        throw new Error('Could not send verification email: ' + error.message);
    }
};
