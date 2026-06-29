const fetch = require('node-fetch');

// 互亿无线短信配置（部署到 Vercel 后在 Dashboard 设置环境变量）
const HUYI_CONFIG = {
  account: process.env.HUYI_ACCOUNT || 'C47521534',
  password: process.env.HUYI_PASSWORD || '30c204e77cc2bc6dd5728bfc789d08de',
  apiUrl: 'http://106.ihuyi.com/webservice/sms.php'
};

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, msg: 'Method not allowed' });
  }

  const { phone, action } = req.body;

  if (!phone || phone.length !== 11) {
    return res.status(400).json({ ok: false, msg: '请输入正确的手机号' });
  }

  try {
    if (action === 'send') {
      const code = generateCode();
      const content = `您的验证码是：${code}。请不要把验证码泄露给其他人。`;

      const params = new URLSearchParams();
      params.append('method', 'Submit');
      params.append('account', HUYI_CONFIG.account);
      params.append('password', HUYI_CONFIG.password);
      params.append('mobile', phone);
      params.append('content', content);
      params.append('format', 'json');

      const response = await fetch(HUYI_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const result = await response.json();

      if (result.code === 2) {
        return res.json({ ok: true, msg: '验证码已发送', code: code });
      } else {
        return res.json({ ok: false, msg: '发送失败：' + (result.msg || '未知错误') });
      }
    } else if (action === 'verify') {
      const { code } = req.body;
      if (!code || code.length !== 6) {
        return res.status(400).json({ ok: false, msg: '请输入6位验证码' });
      }
      return res.json({ ok: true, msg: '验证通过' });
    }
  } catch (error) {
    console.error('SMS error:', error);
    return res.json({ ok: false, msg: '发送失败：网络错误' });
  }

  return res.status(400).json({ ok: false, msg: '无效的操作' });
};