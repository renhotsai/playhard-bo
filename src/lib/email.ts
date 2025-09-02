import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// HTML template for magic link invitation
const MAGIC_LINK_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PlayHard 帳戶邀請</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            color: white;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #333;
            margin-top: 0;
            font-size: 22px;
            font-weight: 600;
        }
        .content p {
            margin-bottom: 20px;
            font-size: 16px;
            color: #555;
        }
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        .cta-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            display: inline-block;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-1px);
        }
        .warning-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }
        .warning-box p {
            margin: 0;
            color: #856404;
            font-weight: 500;
        }
        .link-fallback {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .link-fallback p {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
        }
        .link-text {
            background: #e9ecef;
            padding: 8px;
            border-radius: 4px;
            word-break: break-all;
            font-family: monospace;
            font-size: 13px;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            padding: 20px;
            background: #f8f9fa;
        }
        .footer p {
            margin: 5px 0;
        }
        .logo {
            display: inline-block;
            background: white;
            padding: 8px 16px;
            border-radius: 6px;
            margin-bottom: 10px;
        }
        .logo-text {
            color: #667eea;
            font-weight: 700;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <span class="logo-text">PlayHard</span>
            </div>
            <h1>歡迎加入管理系統</h1>
        </div>
        
        <div class="content">
            <h2>您已被邀請加入 PlayHard 後台系統</h2>
            <p>親愛的用戶，您好！</p>
            <p>恭喜您被邀請加入 PlayHard 後台管理系統。我們很高興您能成為團隊的一員！</p>
            <p>請點擊下方按鈕來完成您的帳戶設定，並開始使用系統。</p>
            
            <div class="button-container">
                <a href="{{magicLinkUrl}}" class="cta-button">
                    ✨ 完成帳戶設定
                </a>
            </div>
            
            <div class="warning-box">
                <p>
                    <strong>⏰ 重要提醒：</strong>此邀請連結將在 <strong>{{expiresInMinutes}} 分鐘</strong>後失效，請盡快完成設定。
                </p>
            </div>
            
            <div class="link-fallback">
                <p style="margin-bottom: 10px;"><strong>無法點擊按鈕？</strong></p>
                <p>請複製以下連結到您的瀏覽器中：</p>
                <div class="link-text">{{magicLinkUrl}}</div>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #777;">
                如果您不是預期收到此邀請的人，請忽略此郵件或聯繫我們的技術支援。
            </p>
        </div>
        
        <div class="footer">
            <p><strong>PlayHard 劇本殺管理系統</strong></p>
            <p>此郵件由系統自動發送，請勿直接回覆。</p>
            <p style="margin-top: 10px; color: #999;">© 2024 PlayHard. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

export async function sendMagicLinkEmail(
  data: { email: string; url: string; token: string; }
): Promise<void> {
  try {
    const { email, url: magicLinkUrl, token } = data;
    console.log(`[EMAIL DEBUG] Starting email send to: ${email}`);
    console.log(`[EMAIL DEBUG] Magic link URL: ${magicLinkUrl}`);
    console.log(`[EMAIL DEBUG] Token: ${token.substring(0, 10)}...`);
    console.log(`[EMAIL DEBUG] Resend API key present: ${!!process.env.RESEND_API_KEY}`);
    
    // Replace placeholders in template
    const htmlTemplate = MAGIC_LINK_TEMPLATE
      .replace(/{{magicLinkUrl}}/g, magicLinkUrl)
      .replace(/{{expiresInMinutes}}/g, '15');
    
    const emailPayload = {
      from: 'PlayHard Admin <onboarding@resend.dev>',
      to: [email],
      subject: '🎭 您的 PlayHard 帳戶邀請 - 請完成設定',
      html: htmlTemplate,
      text: `歡迎加入 PlayHard 管理系統！\n\n您已被邀請加入 PlayHard 後台管理系統。\n\n請點擊以下連結完成帳戶設定: ${magicLinkUrl}\n\n此連結將在 15 分鐘後失效。\n\nPlayHard 團隊`
    };
    
    console.log('[EMAIL DEBUG] Email payload:', JSON.stringify({
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      textLength: emailPayload.text.length,
      htmlLength: emailPayload.html.length
    }, null, 2));
    
    const { data: sendData, error } = await resend.emails.send(emailPayload);
    
    if (error) {
      console.error('[EMAIL ERROR] Resend API error:', error);
      throw new Error('Failed to send invitation email: ' + JSON.stringify(error));
    }
    
    console.log('[EMAIL SUCCESS] Magic link email sent successfully:', sendData);
  } catch (error) {
    console.error('[EMAIL ERROR] Resend error:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'PlayHard Admin <admin@playhard.local>',
      to: [email],
      subject: '🔒 PlayHard 密碼重設',
      html: `
        <h1>密碼重設請求</h1>
        <p>您好！我們收到您的密碼重設請求。</p>
        <p><a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">重設密碼</a></p>
        <p>如果您沒有要求重設密碼，請忽略此郵件。</p>
      `,
      text: `密碼重設請求\n\n請點擊以下連結重設您的密碼: ${resetUrl}\n\n如果您沒有要求重設密碼，請忽略此郵件。`
    });
    
    if (error) {
      console.error('Password reset email error:', error);
      throw new Error('Failed to send password reset email');
    }
    
    return data;
  } catch (error) {
    console.error('Password reset email error:', error);
    throw error;
  }
}