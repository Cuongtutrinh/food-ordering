const nodemailer = require('nodemailer');

const createTransporter = () => {
  // Nếu không có cấu hình email, trả về transporter giả lập
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  Email configuration missing - using demo mode');
    return {
      sendMail: (mailOptions) => {
        console.log('📧 DEMO EMAIL SENT:');
        console.log('   To:', mailOptions.to);
        console.log('   Subject:', mailOptions.subject);
        
        // Extract reset URL from HTML
        const urlMatch = mailOptions.html.match(/href="([^"]*)"/);
        const resetUrl = urlMatch ? urlMatch[1] : 'No URL found';
        console.log('   Reset URL:', resetUrl);
        console.log('---');
        
        return Promise.resolve({ messageId: 'demo-message-id' });
      }
    };
  }

 const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: true,
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Verify connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.log('❌ Email configuration error:', error);
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });

  return transporter;
};

exports.sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@foodorder.com',
      to: email,
      subject: 'Đặt lại mật khẩu - FoodOrder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #f97316; margin: 0;">🍕 FoodOrder</h2>
          </div>
          
          <h3 style="color: #333; margin-bottom: 16px;">Đặt lại mật khẩu</h3>
          
          <p style="color: #666; margin-bottom: 16px;">Xin chào,</p>
          
          <p style="color: #666; margin-bottom: 20px;">
            Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản FoodOrder của mình. 
            Vui lòng click vào nút bên dưới để đặt lại mật khẩu:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Đặt lại mật khẩu
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-bottom: 8px;">
            ⏰ Liên kết này sẽ hết hạn sau <strong>10 phút</strong>.
          </p>
          
          <p style="color: #999; font-size: 14px; margin-bottom: 8px;">
            🔒 Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
          </p>
          
          <p style="color: #999; font-size: 14px; margin-bottom: 0;">
            Trân trọng,<br>
            <strong>Đội ngũ FoodOrder</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            Nếu nút trên không hoạt động, bạn có thể copy và paste link sau vào trình duyệt:<br>
            <a href="${resetUrl}" style="color: #f97316; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    
    // Fallback: log thông tin để test
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    console.log('📧 DEMO FALLBACK - Reset URL:', resetUrl);
    
    return false;
  }
};

// Thêm hàm gửi email xác nhận đơn hàng
exports.sendOrderConfirmationEmail = async (email, order) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@foodorder.com',
      to: email,
      subject: `Xác nhận đơn hàng #${order._id} - FoodOrder`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Đơn hàng của bạn đã được xác nhận!</h2>
          <p>Cảm ơn bạn đã đặt hàng tại FoodOrder.</p>
          
          <h3>Thông tin đơn hàng:</h3>
          <p><strong>Mã đơn hàng:</strong> #${order._id}</p>
          <p><strong>Ngày đặt:</strong> ${new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
          <p><strong>Tổng tiền:</strong> ${order.totalAmount.toLocaleString('vi-VN')}₫</p>
          <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'MoMo'}</p>
          
          <h3>Địa chỉ giao hàng:</h3>
          <p>${order.shippingAddress}</p>
          <p>SĐT: ${order.phone}</p>
          
          <p>Chúng tôi sẽ thông báo cho bạn khi đơn hàng được giao.</p>
          <p>Trân trọng,<br>Đội ngũ FoodOrder</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Order confirmation email error:', error);
    return false;
  }
};

exports.sendReviewReminder = async (email, orderData) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Đánh giá đơn hàng của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Cảm ơn bạn đã mua hàng!</h2>
          <p>Đơn hàng của bạn đã được giao thành công.</p>
          <p>Hãy chia sẻ trải nghiệm của bạn bằng cách đánh giá sản phẩm.</p>
          <a href="${process.env.CLIENT_URL}/orders" 
             style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">
            Đánh giá ngay
          </a>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Review reminder email sent successfully');
  } catch (error) {
    console.error('Error sending review reminder email:', error);
    throw error;
  }
};