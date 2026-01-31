
import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env file
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const testEmail = async () => {
    const to = process.argv[2];
    if (!to) {
        console.log('Usage: npm run test-email <email>');
        process.exit(1);
    }

    console.log(`Attempting to send test email to: ${to}...`);
    console.log(`Using API Key: ${process.env.RESEND_API_KEY ? 'FOUND (starts with ' + process.env.RESEND_API_KEY.substring(0, 5) + '...)' : 'NOT FOUND'}`);

    try {
        const { data, error } = await resend.emails.send({
            from: 'AptiArena <onboarding@resend.dev>',
            to: [to],
            subject: 'Test Email from AptiArena',
            text: 'If you see this, Resend is working!',
        });

        if (error) {
            console.error('❌ RESEND ERROR:', error);
            if (error.message.includes('onboarding@resend.dev')) {
                console.log('\n💡 TIP: With the free onboarding email, you can ONLY send to the email you used to sign up for Resend.');
                console.log('To send to others, you must verify a domain in the Resend dashboard.');
            }
        } else {
            console.log('✅ SUCCESS! Email sent. ID:', data?.id);
        }
    } catch (err: any) {
        console.error('❌ CRASHED:', err.message);
    }
};

testEmail();
