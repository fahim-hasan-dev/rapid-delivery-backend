import config from '../config'
import { ICreateAccount, IResetPassword } from '../interfaces/emailTemplate'

const createAccount = (values: ICreateAccount) => {
 console.log(values, 'values')
 const data = {
  to: values.email,
  subject: `Verify your Rapid-Delivery account, ${values.name}`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
 <table width="100%" cellpadding="0" cellspacing="0"
     style="max-width:640px; margin:40px auto; background-color:#ffffff; border-radius:14px;
        overflow:hidden; box-shadow:0 5px 25px rgba(0,0,0,0.08);">
  
  <!-- Header -->
  <tr>
   <td align="center" style="background:linear-gradient(135deg,#FEF5F0,#FFE6D9); padding:35px 20px; border-bottom:1px solid #FF4A0033;">
   </td>
  </tr>

  <!-- Body -->
  <tr>
   <td style="padding:45px;">
    <h1 style="color:#FF4A00; font-size:26px; font-weight:700; margin-bottom:15px; text-align:center;">
     Verify Your Email 
    </h1>

    <p style="color:#4D1600; font-size:16px; line-height:1.6; margin-bottom:25px; text-align:center;">
     Hey <strong>${values.name}</strong>, welcome to <strong>Rapid-Delivery</strong>! <br>
     Please verify your email to activate your account.
    </p>

    <!-- OTP Box -->
    <div style="background:linear-gradient(145deg,#FFEBE0,#FFD6C2); border:2px solid #FF4A00; 
          border-radius:12px; padding:25px 0; text-align:center; margin:30px auto; max-width:300px;">
     <span style="font-size:40px; font-weight:700; color:#4D1600; letter-spacing:6px;">
      ${values.otp}
     </span>
    </div>

    <p style="color:#4D1600; font-size:15px; line-height:1.6; text-align:center;">
     This code will expire in <strong>5 minutes</strong>.<br>
     If you didn’t request this, you can safely ignore this email.
    </p>

    <!-- Tip -->
    <div style="margin-top:35px; background-color:#fff8e1; border-left:6px solid #ffd54f; 
          border-radius:8px; padding:15px 18px;">
     <p style="margin:0; color:#4a4a4a; font-size:14px;">
      🔒 For security reasons, never share this code with anyone.
     </p>
    </div>

    <!-- Button removed -->
   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" style="background:linear-gradient(135deg,#FEF5F0,#FFE6D9); padding:25px 20px; border-top:1px solid #FF4A0033;">
    <p style="margin:0; color:#4D1600; font-size:13px;">
     © ${new Date().getFullYear()} <strong>Rapid-Delivery</strong>. All rights reserved.
    </p>
    <p style="margin:6px 0 0; color:#4D1600; font-size:13px;">
     Powered by <strong style="color:#FF4A00;">Rapid-Delivery API</strong> 
    </p>
   </td>
  </tr>

 </table>
</body>
</html>
  `,
 }
 return data
}

const resetPassword = (values: IResetPassword) => {
 console.log(values, 'values')
 const data = {
  to: values.email,
  subject: `Reset your Rapid-Delivery password, ${values.name}`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
 <table width="100%" cellpadding="0" cellspacing="0"
     style="max-width:640px; margin:40px auto; background-color:#ffffff; border-radius:14px;
        overflow:hidden; box-shadow:0 5px 25px rgba(0,0,0,0.08);">
  
  <!-- Header -->
  <tr>
   <td align="center" style="background:linear-gradient(135deg,#FEF5F0,#FFE6D9); padding:35px 20px; border-bottom:1px solid #FF4A0033;">
   </td>
  </tr>

  <!-- Body -->
  <tr>
   <td style="padding:45px;">
    <h1 style="color:#FF4A00; font-size:26px; font-weight:700; margin-bottom:15px; text-align:center;">
     Password Reset Request 
    </h1>

    <p style="color:#4D1600; font-size:16px; line-height:1.6; margin-bottom:25px; text-align:center;">
     Hi <strong>${values.name}</strong>, 👋<br>
     We received a request to reset your password for your <strong>Rapid-Delivery</strong> account.
     <br>Enter the code below to complete the process:
    </p>

    <!-- OTP Box -->
    <div style="background:linear-gradient(145deg,#FFEBE0,#FFD6C2); border:2px solid #FF4A00;
          border-radius:12px; padding:25px 0; text-align:center; margin:30px auto; max-width:300px;">
     <span style="font-size:40px; font-weight:700; color:#4D1600; letter-spacing:6px;">
      ${values.otp}
     </span>
    </div>

    <p style="color:#4D1600; font-size:15px; line-height:1.6; text-align:center;">
     This verification code is valid for <strong>5 minutes</strong>.<br>
     If you didn’t request this, please ignore this email — your account is safe.
    </p>

    <!-- Tip -->
    <div style="margin-top:35px; background-color:#fff8e1; border-left:6px solid #ffd54f;
          border-radius:8px; padding:15px 18px;">
     <p style="margin:0; color:#4a4a4a; font-size:14px;">
       <strong>Security Tip:</strong> Never share your reset code with anyone. Rapid-Delivery will never ask for it.
     </p>
    </div>

    <!-- Button removed -->
   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" style="background:linear-gradient(135deg,#FEF5F0,#FFE6D9); padding:25px 20px; border-top:1px solid #FF4A0033;">
    <p style="margin:0; color:#4D1600; font-size:13px;">
     © ${new Date().getFullYear()} <strong>Rapid-Delivery</strong>. All rights reserved.
    </p>
    <p style="margin:6px 0 0; color:#4D1600; font-size:13px;">
     Powered by <strong style="color:#FF4A00;">Rapid-Delivery API</strong> 
    </p>
   </td>
  </tr>

 </table>
</body>
</html>
  `,
 }

 return data
}

const resendOtp = (values: {
 email: string
 name: string
 otp: string
 type: 'resetPassword' | 'createAccount'
}) => {
 console.log(values, 'values')
 const isReset = values.type === 'resetPassword'

 const data = {
  to: values.email,
  subject: `${isReset ? 'Password Reset' : 'Account Verification'} - New Code`,
  html: `
  <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
 <table width="100%" cellpadding="0" cellspacing="0"
     style="max-width:640px; margin:40px auto; background:#ffffff; border-radius:14px;
        overflow:hidden; box-shadow:0 5px 25px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
   <td align="center" style="background-color:#FEF5F0; padding:35px 20px; border-top:1px solid #FFE6D9;">
   </td>
  </tr>

  <!-- Body -->
  <tr>
   <td style="padding:45px;">
    <h1 style="color:#4D1600; font-size:26px; font-weight:700; margin-bottom:15px; text-align:center;">
     ${isReset ? 'Reset Your Password ' : 'Verify Your Account '}
    </h1>

    <p style="color:#662400; font-size:16px; line-height:1.6; margin-bottom:25px; text-align:center;">
     Hi <strong>${values.name}</strong>, 👋<br>
     ${isReset
    ? 'You requested a new verification code to reset your Rapid-Delivery password.'
    : 'Here is your new verification code to complete your Rapid-Delivery account setup.'
   }<br>
     Use the code below to continue:
    </p>

    <!-- OTP Box -->
    <div style="background:linear-gradient(145deg,#FFEBE0,#FFD6C2);
          border:2px solid #FF4A00; border-radius:12px;
          padding:25px 0; text-align:center;
          margin:30px auto; max-width:300px;">
     <span style="font-size:40px; font-weight:700; color:#4D1600; letter-spacing:6px;">
      ${values.otp}
     </span>
    </div>

    <p style="color:#662400; font-size:15px; line-height:1.6; text-align:center;">
     This code is valid for <strong>5 minutes</strong>.<br>
     If this was not you, please ignore the email.
    </p>

    <!-- Tip -->
    <div style="margin-top:35px; background-color:#fff8e1;
          border-left:6px solid #ffd54f;
          border-radius:8px; padding:15px 18px;">
     <p style="margin:0; color:#4a4a4a; font-size:14px;">
      🔒 <strong>Security Tip:</strong> Never share your OTP with anyone. Rapid-Delivery
 will never request it.
     </p>
    </div>

    <!-- Button removed -->
   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" style="background-color:#FEF5F0; padding:25px 20px; border-top:1px solid #FFE6D9;">
    <p style="margin:0; color:#4D1600; font-size:13px;">
     © ${new Date().getFullYear()} <strong>Rapid-Delivery</strong>. All rights reserved.
    </p>
    <p style="margin:6px 0 0; color:#662400; font-size:13px;">
     Powered by <strong style="color:#4D1600;">Rapid-Delivery API</strong> 
    </p>
   </td>
  </tr>

 </table>
</body>
</html>
  `,
 }

 return data
}

const adminContactNotificationEmail = (payload: {
 firstName: string
 lastName: string
 email: string
 phone?: string
 subject: string
 message: string
}) => {
 return {
  to: config.super_admin.email as string,
  subject: ' New Contact Form Submission – Rapid-Delivery',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
 <table width="100%" cellpadding="0" cellspacing="0"
     style="max-width:640px; margin:40px auto; background-color:#ffffff; border-radius:14px;
        overflow:hidden; box-shadow:0 5px 25px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
   <td align="center" 
     style="background:linear-gradient(135deg,#FEF5F0,#FFE6D9); padding:35px 20px; border-bottom:1px solid #FF4A0033;">
   </td>
  </tr>

  <!-- Body -->
  <tr>
   <td style="padding:45px;">
    <h1 style="color:#FF4A00; font-size:26px; font-weight:700; margin-bottom:20px; text-align:center;">
      New Contact Submission
    </h1>

    <p style="color:#4D1600; font-size:16px; text-align:center; margin-bottom:30px;">
     A new contact message has been submitted on <strong>Rapid-Delivery</strong>.
    </p>

    <!-- Contact Details -->
    <table style="width:100%; border-collapse:collapse; margin:20px 0;">
     <tr>
      <td style="padding:12px 0; font-size:15px; color:#4D1600;"> <strong>Name:</strong></td>
      <td style="padding:12px 0; font-size:15px; color:#4D1600; text-align:right;">
       ${payload.firstName} ${payload.lastName}
      </td>
     </tr>

     <tr style="border-top:1px solid #FF4A0022;">
      <td style="padding:12px 0; font-size:15px; color:#4D1600;"> <strong>Subject:</strong></td>
      <td style="padding:12px 0; font-size:15px; color:#4D1600; text-align:right;">
       ${payload.subject}
      </td>
     </tr>

     <tr style="border-top:1px solid #FF4A0022;">
      <td style="padding:12px 0; font-size:15px; color:#4D1600;"> <strong>Email:</strong></td>
      <td style="padding:12px 0; font-size:15px; color:#4D1600; text-align:right;">
       ${payload.email}
      </td>
     </tr>

     <tr style="border-top:1px solid #FF4A0022;">
      <td style="padding:12px 0; font-size:15px; color:#4D1600;"> <strong>Phone:</strong></td>
      <td style="padding:12px 0; font-size:15px; color:#4D1600; text-align:right;">
       ${payload.phone || 'N/A'}
      </td>
     </tr>
    </table>

    <!-- Message Box -->
    <div style="background:linear-gradient(145deg,#FFEBE0,#FFD6C2); border:2px solid #FF4A00;
          border-radius:12px; padding:20px; margin-top:30px;">
     <p style="margin:0; font-size:15px; color:#4D1600; line-height:1.6;">
      “${payload.message}”
     </p>
    </div>

    <p style="color:#4D1600; font-size:14px; margin-top:30px; text-align:center;">
     You can respond directly to <strong>${payload.email}</strong>.
    </p>
   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" 
     style="background:linear-gradient(135deg,#FEF5F0,#FFE6D9); padding:25px 20px; border-top:1px solid #FF4A0033;">
    <p style="margin:0; color:#4D1600; font-size:13px;">
     © ${new Date().getFullYear()} <strong>Rapid-Delivery</strong>. All rights reserved.
    </p>
    <p style="margin:6px 0 0; color:#4D1600; font-size:13px;">
     Powered by <strong style="color:#FF4A00;">Rapid-Delivery API</strong> 
    </p>
   </td>
  </tr>

 </table>
</body>
</html>
  `,
 }
}


const userContactConfirmationEmail = (payload: {
 firstName: string
 lastName: string
 email: string
 subject: string
 message: string
}) => {
 return {
  to: payload.email,
  subject: ' Thank You for Contacting Rapid-Delivery',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
 <table width="100%" cellpadding="0" cellspacing="0"
     style="max-width:640px; margin:40px auto; background-color:#ffffff; border-radius:14px;
        overflow:hidden; box-shadow:0 5px 25px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
   <td align="center" 
     style="background:linear-gradient(135deg,#FEF5F0,#FFE6D9); padding:35px 20px; border-bottom:1px solid #FF4A0033;">
   </td>
  </tr>

  <!-- Body -->
  <tr>
   <td style="padding:45px;">
    <h1 style="color:#FF4A00; font-size:26px; font-weight:700; margin-bottom:20px; text-align:center;">
     Thank You for Contacting Us 
    </h1>

    <p style="color:#4D1600; font-size:16px; line-height:1.6; text-align:center;">
     Dear <strong>${payload.firstName} ${payload.lastName}</strong>,<br>
     We’ve received your message regarding "<strong>${payload.subject}</strong>"! Our support team will reach out to you shortly.
    </p>

    <!-- User Message -->
    <div style="background:linear-gradient(145deg,#FFEBE0,#FFD6C2); border:2px solid #FF4A00; 
          border-radius:12px; padding:25px 20px; text-align:center; margin:30px auto; max-width:500px;">
     <p style="font-size:15px; color:#4D1600; line-height:1.6; margin:0;">
      <em>“${payload.message}”</em>
     </p>
    </div>

    <p style="color:#4D1600; font-size:15px; line-height:1.6; text-align:center;">
     Thanks for reaching out to <strong>Rapid-Delivery</strong>.<br>
     We truly appreciate your message 
    </p>

    <!-- Button removed -->
   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" 
     style="background:linear-gradient(135deg,#FEF5F0,#FFE6D9); padding:25px 20px; border-top:1px solid #FF4A0033;">
    <p style="margin:0; color:#4D1600; font-size:13px;">
     © ${new Date().getFullYear()} <strong>Rapid-Delivery</strong>. All rights reserved.
    </p>
    <p style="margin:6px 0 0; color:#4D1600; font-size:13px;">
     Powered by <strong style="color:#FF4A00;">Rapid-Delivery API</strong> 
    </p>
   </td>
  </tr>

 </table>
</body>
</html>
  `,
 }
}


const contactReplyEmail = (payload: {
 email: string
 name: string
 originalMessage: string
 replyMessage: string
}) => {
 return {
  to: payload.email,
  subject: ' Reply to your message - Rapid-Delivery Support',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
 <table width="100%" cellpadding="0" cellspacing="0"
     style="max-width:640px; margin:40px auto; background-color:#ffffff; border-radius:14px;
        overflow:hidden; box-shadow:0 5px 25px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
   <td align="center" 
     style="background:linear-gradient(135deg,#FEF5F0,#FFE6D9); padding:35px 20px; border-bottom:1px solid #FF4A0033;">
   </td>
  </tr>

  <!-- Body -->
  <tr>
   <td style="padding:45px;">
    <h1 style="color:#FF4A00; font-size:26px; font-weight:700; margin-bottom:20px; text-align:center;">
     Response from Support 
    </h1>

    <p style="color:#4D1600; font-size:16px; line-height:1.6; text-align:left;">
     Hi <strong>${payload.name}</strong>,<br><br>
     Our team has reviewed your recent query. Here is our response:
    </p>

    <!-- Admin Reply -->
    <div style="background-color:#F9F9F9; border-left:4px solid #FF4A00; 
          padding:20px; margin:20px 0;">
     <p style="font-size:15px; color:#333; line-height:1.6; margin:0;">
      ${payload.replyMessage.replace(/\n/g, '<br>')}
     </p>
    </div>

    <!-- Original Message -->
    <h3 style="color:#4D1600; font-size:16px; margin-top:30px;">Your original message:</h3>
    <div style="background-color:#F1F1F1; padding:15px; border-radius:8px; margin-bottom:20px;">
     <p style="font-size:14px; color:#555; line-height:1.5; margin:0; font-style:italic;">
      "${payload.originalMessage}"
     </p>
    </div>

    <p style="color:#4D1600; font-size:15px; line-height:1.6; text-align:left;">
     If you have any further questions, feel free to contact us again.<br><br>
     Best regards,<br>
     <strong>The Rapid-Delivery Team</strong>
    </p>

   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" 
     style="background:linear-gradient(135deg,#FEF5F0,#FFE6D9); padding:25px 20px; border-top:1px solid #FF4A0033;">
    <p style="margin:0; color:#4D1600; font-size:13px;">
     © ${new Date().getFullYear()} <strong>Rapid-Delivery</strong>. All rights reserved.
    </p>
   </td>
  </tr>

 </table>
</body>
</html>
  `,
 }
}


const sendPaymentConfirmationEmail = (data: any) => {
 const parcelsHtml = data.parcel
  .map(
   (p: any, i: number) => `
    <tr>
     <td style="padding:6px 0; color:#00000099;">Parcel ${i + 1}:</td>
     <td style="padding:6px 0; color:#000000; text-align:right;">
      ${p.name}, ${p.weight}${p.mass_unit}
     </td>
    </tr>
   `,
  )
  .join('')

 return {
  to: data.address_to.email,
  subject: ` Payment Completed – Rapid-Delivery Order`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0; font-family:'Inter','Segoe UI',sans-serif;">
 <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:14px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">

  <!-- Header -->
  <tr>
   <td align="center" style="background:linear-gradient(135deg, #FEF5F0, #FFE6D9); padding:30px 20px;">
    <h1 style="color:#FF4A00; font-size:22px; margin:0;">Payment Successful </h1>
   </td>
  </tr>

  <!-- Body -->
  <tr>
   <td style="padding:30px 25px;">
    <p style="color:#000; font-size:15px; line-height:1.6; text-align:center;">
     Hello <strong style="color:#FF4A00;">${data.address_from.name}</strong>, your payment for your shipping order has been successfully completed.
    </p>

    <!-- Sender & Receiver -->
    <h2 style="color:#FF4A00; font-size:17px; margin-top:25px;"> Sender & Receiver</h2>
    <p style="font-size:14px; margin:3px 0;"><strong>From:</strong> ${data.address_from.name}, ${data.address_from.city}, ${data.address_from.country}</p>
    <p style="font-size:14px; margin:3px 0;"><strong>To:</strong> ${data.address_to.name}, ${data.address_to.city}, ${data.address_to.country}</p>

    <!-- Shipping Summary -->
    <h3 style="color:#FF4A00; font-size:16px; margin-top:20px;"> Shipping Details</h3>
    <p style="font-size:14px; margin:3px 0;">Type: <strong>${data.shipping_type}</strong></p>
    <p style="font-size:14px; margin:3px 0;">Status: <strong>${data.status}</strong></p>

    <!-- Parcel Details -->
    <h3 style="color:#FF4A00; font-size:16px; margin-top:20px;"> Parcels</h3>
    <table style="width:100%; border-collapse:collapse;">${parcelsHtml}</table>

    <!-- Insurance -->
    <h3 style="color:#FF4A00; font-size:16px; margin-top:20px;"> Insurance</h3>
    <p style="font-size:14px; margin:3px 0;">Insured: <strong>${data.insurance.isInsured ? 'Yes' : 'No'}</strong></p>
    <p style="font-size:14px; margin:3px 0;">Product Value: £${data.insurance.productValue}</p>
    <p style="font-size:14px; margin:3px 0; color:#FF4A00; font-weight:700;">Insurance Cost: £${data.insurance.insuranceCost}</p>

    <!-- Payment Summary -->
    <h3 style="color:#FF4A00; font-size:16px; margin-top:20px;"> Payment</h3>
    <p style="font-size:14px; margin:3px 0;">Shipping Cost: £${data.shipping_cost}</p>
    <p style="font-size:14px; margin:3px 0; color:#FF4A00; font-weight:700;">Total Paid: £${data.total_cost}</p>

    <!-- Notes -->
    <div style="background:#FF4A0022; padding:12px 15px; border-radius:10px; margin-top:15px;">
     <p style="margin:0; font-size:13px; color:#000;"> Notes: ${data.notes || 'None'}</p>
    </div>
   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" style="background:#f5f5f5; padding:15px; font-size:12px; color:#777;">
    © ${new Date().getFullYear()} — Rapid-Delivery Services. Built with for your comfort
   </td>
  </tr>

 </table>
</body>
</html>
  `,
 }
}

const sendAdminPaymentNotificationEmail = (data: any) => {
 return {
  to: config.super_admin.email as string,
  subject: ` Payment Completed by ${data.address_from.name} – ${data.shipping_type}`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0; font-family:'Inter','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
 <table width="100%" cellpadding="0" cellspacing="0"
  style="max-width:640px; margin:40px auto; background:#ffffff; border-radius:16px;
      overflow:hidden; border:1px solid #FF4A0055; box-shadow:0 4px 20px #00000011;">

  <!-- Header -->
  <td align="center" 
 style="
  background: linear-gradient(135deg, #FEF5F0, #FFE6D9);
  padding: 35px 20px; 
  border-bottom: 1px solid #FF4A0033;
 "
>
 <h1 style="
  color:#FF4A00; 
  font-size:24px; 
  font-weight:700; 
  margin:0;
 ">
  Payment Completed Notification
 </h1>
</td>


  <!-- Body -->
  <tr>
   <td style="padding:40px;">
    <p style="color:#00000099; font-size:15px; line-height:1.7; text-align:center;">
     <strong style="color:#FF4A00;">${data.address_from.name}</strong> has successfully completed the payment for
     <strong>${data.shipping_type}</strong>.
    </p>

    <!-- Service Summary -->
    <h2 style="color:#FF4A00; font-size:19px; margin-bottom:15px; margin-top:30px;">
      Shipping Details
    </h2>

    <table style="width:100%; border-collapse:collapse;">

     <tr>
      <td style="padding:8px 0; color:#00000099;">Customer Name:</td>
      <td style="padding:8px 0; color:#000000; text-align:right;">
       ${data.address_from.name}
      </td>
     </tr>

     <tr style="border-top:1px solid #FF4A0022;">
      <td style="padding:8px 0; color:#00000099;">Email:</td>
      <td style="padding:8px 0; color:#000000; text-align:right;">
       ${data.address_from.email}
      </td>
     </tr>

     <tr style="border-top:1px solid #FF4A0022;">
      <td style="padding:8px 0; color:#00000099;">Phone:</td>
      <td style="padding:8px 0; color:#000000; text-align:right;">
       ${data.address_from.phone}
      </td>
     </tr>

     <tr style="border-top:1px solid #FF4A0022;">
      <td style="padding:8px 0; color:#00000099;">Shipping Type:</td>
      <td style="padding:8px 0; color:#000000; text-align:right;">
       ${data.shipping_type}
      </td>
     </tr>

     <tr style="border-top:1px solid #FF4A0022;">
      <td style="padding:8px 0; color:#00000099;">Address:</td>
      <td style="padding:8px 0; color:#000000; text-align:right;">
       ${data.address_from.street1}, ${data.address_from.city}, 
       ${data.address_from.state}, ${data.address_from.postal_code}, ${data.address_from.country}
      </td>
     </tr>

     <tr style="border-top:1px solid #FF4A0022;">
      <td style="padding:8px 0; color:#00000099;">Total Paid:</td>
      <td style="padding:8px 0; color:#FF4A00; font-weight:700; text-align:right;">
       £${data.total_cost}
      </td>
     </tr>

    </table>

    <!-- Notes -->
    <div style="background:#FF4A0022; padding:15px 18px; border-radius:12px;
          border-left:4px solid #FF4A00; margin-top:25px;">
     <p style="margin:0; color:#000000; font-size:14px;">
       <strong>Notes:</strong> ${data.notes || 'No additional notes'}
     </p>
    </div>

   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" style="background:#f9f9f9; padding:22px; border-top:1px solid #FF4A0022;">
    <p style="margin:0; color:#00000099; font-size:12px;">
     © ${new Date().getFullYear()} — Rapid-Delivery Services
    </p>
    <p style="margin:5px 0 0; color:#00000099; font-size:12px;">
     Built with for your comfort
    </p>
   </td>
  </tr>

 </table>
</body>
</html>
  `,
 }
}

const businessUserShipmentInfoEmail = (data: any) => {
 const parcels = data.parcel
  .map(
   (p: any, i: number) => `<tr>
    <td style="padding:4px 0; color:#555;">Parcel ${i + 1}:</td>
    <td style="padding:4px 0; text-align:right; color:#000;">
     ${p.name} — ${p.weight}${p.mass_unit} (${p.length}x${p.width}x${p.height}${p.distance_unit})
    </td>
   </tr>`,
  )
  .join('')

 return {
  to: data.address_from.email,
  subject: ` Your Lost Item Has Been Booked – #${data._id}`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;font-family:Inter,Segoe UI,sans-serif;background:#f7f9fc;">
 <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.06);">
  
  <!-- Header -->
  <tr>
   <td align="center" style="background:#FFEBE0;padding:25px 20px;">

    <h2 style="margin:0;color:#FF4A00;font-size:20px;">Your Lost Item Has Been Booked!</h2>
    <p style="margin:4px 0 0;color:#555;font-size:13px;">Booking ID: <strong>${data._id}</strong></p>
   </td>
  </tr>

  <!-- Body -->
  <tr>
   <td style="padding:25px 20px;">
    <p style="font-size:14px;color:#000;line-height:1.5;">
     Hello <strong style="color:#FF4A00;">${data.address_from.name}</strong>,<br>
     Your added lost item has been successfully booked for shipment. 
    </p>

    <!-- Shipment Summary -->
    <h3 style="color:#FF4A00;font-size:15px;margin:15px 0 6px;"> Shipment Summary</h3>
    <p style="font-size:13px;margin:2px 0;"><strong>Type:</strong> ${data.shipping_type}</p>
    <p style="font-size:13px;margin:2px 0;"><strong>To:</strong> ${data.address_to.name}, ${data.address_to.city}, ${data.address_to.country}</p>

    <!-- Parcels -->
    <h3 style="color:#FF4A00;font-size:15px;margin:15px 0 6px;"> Parcels</h3>
    <table width="100%" style="margin-top:6px;">${parcels}</table>

    <!-- Notes & Insurance -->
    <div style="background:#FFEBE0;padding:10px;border-radius:8px;margin-top:15px;">
     <p style="margin:2px 0;font-size:13px;"><strong>Notes:</strong> ${data.notes || 'None'}</p>
     ${data.insurance ? `<p style="margin:2px 0;font-size:13px;"><strong>Insurance:</strong> Yes — ${data.insurance.amount}</p>` : ''}
    </div>

    <!-- Button removed -->
   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" style="background:#f0f0f0;padding:12px;font-size:12px;color:#555;">
    © ${new Date().getFullYear()} Rapid-Delivery • Business Services
   </td>
  </tr>
 </table>
</body>
</html>
`,
 }
}

const businessUserRegistrationInviteEmail = (data: any) => {
 const parcels = data.parcel
  .map(
   (p: any, i: number) => `
    <tr>
     <td style="padding:4px 0; color:#555;">Parcel ${i + 1}:</td>
     <td style="padding:4px 0; text-align:right; color:#000;">
      ${p.name} — ${p.weight}${p.mass_unit} (${p.length}x${p.width}x${p.height}${p.distance_unit})
     </td>
    </tr>`,
  )
  .join('')

 return {
  to: data.address_from.email,
  subject: ` Action Required – Create Your Rapid-Delivery Account`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;font-family:Inter,Segoe UI,sans-serif;background:#f7f9fc;">
 <table width="100%" cellpadding="0" cellspacing="0"
     style="max-width:620px;margin:30px auto;background:#fff;
     border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.06);">

  <!-- Header -->
  <tr>
   <td align="center" style="background:#FFEBE0;padding:25px 20px;">

    <h2 style="margin:0;color:#FF4A00;font-size:20px;">A Lost Item Shipment Was Created</h2>
    <p style="margin:4px 0 0;color:#555;font-size:13px;">Booking ID: <strong>${data._id}</strong></p>
   </td>
  </tr>

  <!-- Body -->
  <tr>
   <td style="padding:25px 20px;">
    <p style="font-size:14px;color:#000;line-height:1.5;">
     Hello <strong style="color:#FF4A00;">${data.address_from.name}</strong>,<br>
     A customer has booked a shipment for the lost item you found. 
     To continue and provide shipping information, you must register a business account.
    </p>

    <!-- Summary -->
    <h3 style="color:#FF4A00;font-size:15px;margin:15px 0 6px;"> Shipment Summary</h3>
    <p style="font-size:13px;margin:2px 0;"><strong>Type:</strong> ${data.shipping_type}</p>
    <p style="font-size:13px;margin:2px 0;"><strong>To:</strong> ${data.address_to.name}, ${data.address_to.city}, ${data.address_to.country}</p>

    <!-- Parcels -->
    <h3 style="color:#FF4A00;font-size:15px;margin:15px 0 6px;"> Parcels</h3>
    <table width="100%" style="margin-top:6px;">${parcels}</table>

    <!-- Notes -->
    <div style="background:#FFEBE0;padding:10px;border-radius:8px;margin-top:15px;">
     <p style="margin:2px 0;font-size:13px;">
      <strong>Notes:</strong> ${data.notes || 'None'}
     </p>
    </div>

    <!-- Button removed -->

    <p style="font-size:13px;color:#555;text-align:center;margin-top:10px;">
     Registration is required to collect shipping information and proceed with the delivery.
    </p>
   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" style="background:#f0f0f0;padding:12px;font-size:12px;color:#555;">
    © ${new Date().getFullYear()} Rapid-Delivery • Business Services
   </td>
  </tr>

 </table>
</body>
</html>`,
 }
}

const guestLostItemNotificationEmail = (data: any) => {
 const businessDetails = data?.user?.BusinessDetails;
 const BASE_URL = "https://api.Rapid-Delivery.com";

 const imagesHtml =
  Array.isArray(data?.images) && data.images.length > 0
   ? `
    <h3 style="color:#FF4A00;font-size:15px;margin:15px 0 8px;">
     📷 Item Images
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0">
     <tr>
      ${data.images
    .map(
     (img: string) => `
        <td align="center" style="padding:6px;">
         <img
          src="${BASE_URL}${img}"
          alt="Lost Item Image"
          style="width:100%;max-width:170px;
          border-radius:10px;border:1px solid #ddd;" />
        </td>
       `
    )
    .join("")}
     </tr>
    </table>
   `
   : "";

 return {
  to: data.guestEmail,
  subject: ` We Found Your Lost Item – Action Required`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;font-family:Inter,Segoe UI,sans-serif;background:#f7f9fc;">
 <table width="100%" cellpadding="0" cellspacing="0"
  style="max-width:620px;margin:30px auto;background:#fff;
  border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.06);">

  <!-- Header -->
  <tr>
   <td align="center" style="background:#FFEBE0;padding:25px 20px;">


    <h2 style="margin:0;color:#FF4A00;font-size:20px;">
     Good News! We Found Your Item
    </h2>

    ${businessDetails
    ? `<p style="margin-top:6px;font-size:13px;color:#333;">
        <strong>${businessDetails.BusinessName || ""}</strong>
        ${businessDetails.companyName
     ? `• ${businessDetails.companyName}`
     : ""
    }
       </p>`
    : ""
   }
   </td>
  </tr>

  <!-- Body -->
  <tr>
   <td style="padding:25px 20px;">

    <p style="font-size:14px;color:#000;line-height:1.6;">
     Hello <strong style="color:#FF4A00;">${data.guestName}</strong>,<br>
     We hope you're doing well. Our team has located an item that matches your belongings.
     Please review the details below.
    </p>

    ${imagesHtml}

    <!-- Item Details -->
    <h3 style="color:#FF4A00;font-size:15px;margin:15px 0 6px;">
     🟦 Lost Item Details
    </h3>
    <p style="font-size:13px;margin:2px 0;"><strong>Item Name:</strong> ${data.itemName}</p>
    <p style="font-size:13px;margin:2px 0;"><strong>Description:</strong> ${data.itemDescription || "N/A"}</p>
    <p style="font-size:13px;margin:2px 0;">
     <strong>Date Found:</strong> ${new Date(data.dateFound).toDateString()}
    </p>
    <p style="font-size:13px;margin:2px 0;">
     <strong>Location Found:</strong> ${data.locationFound}
    </p>

    <!-- Guest Info -->
    <h3 style="color:#FF4A00;font-size:15px;margin:15px 0 6px;">
     🏨 Your Stay Information
    </h3>
    <p style="font-size:13px;margin:2px 0;">
     <strong>Name on Reservation:</strong> ${data.guestReservationName}
    </p>
    <p style="font-size:13px;margin:2px 0;">
     <strong>Room Number:</strong> ${data.guestRoomNumber}
    </p>
    <p style="font-size:13px;margin:2px 0;">
     <strong>Contact Number:</strong> ${data.guestPhone}
    </p>

    <!-- Action -->
    <div style="background:#FFEBE0;padding:12px;border-radius:8px;margin-top:16px;">
     <p style="margin:0;font-size:13px;color:#000;">
      To have your item safely shipped to your address, please complete your shipping details below.
     </p>
    </div>

    <!-- Button removed -->

    <p style="font-size:13px;color:#555;text-align:center;margin-top:12px;">
     If this item does not belong to you, please ignore this email.
    </p>
   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" style="background:#f0f0f0;padding:12px;font-size:12px;color:#555;">
    © ${new Date().getFullYear()} Rapid-Delivery • Lost & Found Services
   </td>
  </tr>

 </table>
</body>
</html>
`,
 };
};



const businessShippingDetailsUpdateEmail = (data: any) => {
 return {
  to: data.address_from.email,
  subject: ` Shipping Details Updated – #${data._id}`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;font-family:Inter,Segoe UI,sans-serif;background:#f7f9fc;">
 <table width="100%" cellpadding="0" cellspacing="0"
     style="max-width:620px;margin:30px auto;background:#fff;
     border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.06);">

  <!-- Header -->
  <tr>
   <td align="center" style="background:#FFEBE0;padding:25px 20px;">

    <h2 style="margin:0;color:#FF4A00;font-size:20px;">Shipping Details Updated</h2>
    <p style="margin:4px 0 0;color:#555;font-size:13px;">Shipment ID: <strong>${data._id}</strong></p>
   </td>
  </tr>

  <!-- Body -->
  <tr>
   <td style="padding:25px 20px;">

    <p style="font-size:14px;color:#000;line-height:1.6;">
     Hello <strong style="color:#FF4A00;">${data.address_from.name}</strong>,<br>
     The shipping for this lost-item shipment has now been <strong>booked with <span style="color:#FF4A00;">${data.carrier || 'the carrier'}</span></strong>.
    </p>

    <div style="background:#FFEBE0;padding:12px;border-radius:8px;margin:14px 0;">
     <p style="margin:0;font-size:13px;color:#CC3B00;line-height:1.5;">
      This shipment is scheduled for delivery to the item owner. Please <strong>collect the required recipient information</strong> (Shipping Label, Tracking Number) and <strong>prepare the parcel for dispatch</strong> so it's ready for carrier pickup.
     </p>
    </div>

    <!-- Shipping Info -->
    <h3 style="color:#FF4A00;font-size:15px;margin:12px 0 6px;">🚚 Current Shipping Details</h3>
    <p style="font-size:13px;margin:2px 0;"><strong>Carrier:</strong> ${data.carrier || 'N/A'}</p>
    <p style="font-size:13px;margin:2px 0;"><strong>Tracking Number:</strong> ${data.tracking_id || 'N/A'}</p>
    ${data.tracking_url ? `<p style="font-size:13px;margin:2px 0;"><strong>Tracking URL:</strong> <a href="${data.tracking_url}" style="color:#FF4A00;">Track Package</a></p>` : ''}



    <!-- Button removed -->

    <p style="font-size:12px;color:#666;text-align:center;margin-top:12px;">
     If you need assistance, contact support or check the shipment in your dashboard.
    </p>

   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" style="background:#f0f0f0;padding:12px;font-size:12px;color:#555;">
    © ${new Date().getFullYear()} Rapid-Delivery • Business Portal
   </td>
  </tr>

 </table>
</body>
</html>
`,
 }
}

const customerShippingDetailsUpdateEmail = (data: any) => {
 return {
  to: data.address_to.email,
  subject: ` Your Shipment Tracking Details Updated – #${data._id}`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;font-family:Inter,Segoe UI,sans-serif;background:#f7f9fc;">
 <table width="100%" cellpadding="0" cellspacing="0"
     style="max-width:620px;margin:30px auto;background:#fff;
     border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.06);">

  <!-- Header -->
  <tr>
   <td align="center" style="background:#FFEBE0;padding:25px 20px;">
    <img src="https://i.ibb.co/Hf7XccNJ/Send-you-back-Final-logo-02-3.png"
       style="height:70px;margin-bottom:8px;" />
    <h2 style="margin:0;color:#FF4A00;font-size:20px;">Your Shipment Is Now Trackable</h2>
    <p style="margin:4px 0 0;color:#555;font-size:13px;">Shipment ID: <strong>${data._id}</strong></p>
   </td>
  </tr>

  <!-- Body -->
  <tr>
   <td style="padding:25px 20px;">

    <p style="font-size:14px;color:#000;line-height:1.6;">
     Hello <strong style="color:#FF4A00;">${data.address_to.name}</strong>,<br>
     Your shipment has now been <strong>booked with the carrier</strong> and is ready for delivery.
     You can use the tracking details below to monitor your package.
    </p>

    <!-- Tracking Info -->
    <h3 style="color:#FF4A00;font-size:15px;margin:16px 0 6px;">🚚 Tracking Details</h3>
    <p style="font-size:13px;margin:2px 0;"><strong>Carrier:</strong> ${data.carrier || 'N/A'}</p>
    <p style="font-size:13px;margin:2px 0;"><strong>Tracking Number:</strong> ${data.tracking_id || 'N/A'}</p>

    <!-- Button removed -->

    <p style="font-size:12px;color:#666;text-align:center;margin-top:16px;">
     If the tracking number is not active yet, please allow a few hours for the carrier to update their system.
    </p>

   </td>
  </tr>

  <!-- Footer -->
  <tr>
   <td align="center" style="background:#f0f0f0;padding:12px;font-size:12px;color:#555;">
    © ${new Date().getFullYear()} Rapid-Delivery • Customer Services
   </td>
  </tr>

 </table>
</body>
</html>
`,
 }
}

const subscriptionActivatedEmail = (data: any) => {
 return {
  to: data.user.email,
  subject: ` Subscription Activated – Welcome to Rapid-Delivery`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;font-family:Inter,Segoe UI,sans-serif;background:#f7f9fc;">
 <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.06);">
  <tr>
   <td align="center" style="background:#FFEBE0;padding:25px 20px;">
    <h2 style="margin:0;color:#FF4A00;font-size:20px;">Subscription Activated!</h2>
   </td>
  </tr>
  <tr>
   <td style="padding:25px 20px;">
    <p style="font-size:14px;color:#000;line-height:1.5;">
     Hello <strong>${data.user.firstName}</strong>,<br>
     Your subscription for <strong>${data.plan.title}</strong> has been successfully activated.
    </p>
    <p style="font-size:13px;margin:2px 0;"><strong>Amount Paid:</strong> £${data.amountPaid}</p>
    <p style="font-size:13px;margin:2px 0;"><strong>Transaction ID:</strong> ${data.trxId}</p>
    <!-- Button removed -->
   </td>
  </tr>
 </table>
</body>
</html>
`,
 }
}

export const emailTemplate = {
 createAccount,
 resetPassword,
 resendOtp,
 userContactConfirmationEmail,
 adminContactNotificationEmail,
 contactReplyEmail,
 sendPaymentConfirmationEmail,
 sendAdminPaymentNotificationEmail,
 businessUserShipmentInfoEmail,
 businessUserRegistrationInviteEmail,
 guestLostItemNotificationEmail,
 businessShippingDetailsUpdateEmail,
 customerShippingDetailsUpdateEmail,
 subscriptionActivatedEmail,
}
