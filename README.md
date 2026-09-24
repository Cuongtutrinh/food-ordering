# Food Ordering App

Ứng dụng đặt món ăn trực tuyến với kiến trúc tách biệt giữa **frontend React** và **backend Node.js/Express**. Hệ thống hỗ trợ người dùng duyệt thực đơn, thêm món và topping vào giỏ hàng, đặt hàng, theo dõi trạng thái, thanh toán COD/VietQR, đánh giá sản phẩm và trò chuyện với chatbot hỗ trợ.

## Tính năng chính

### Dành cho khách hàng

- Đăng ký, đăng nhập và đăng xuất bằng JWT.
- Đăng nhập OAuth với Google và Facebook.
- Quên mật khẩu, đặt lại mật khẩu và đổi mật khẩu.
- Xem danh sách sản phẩm và thông tin chi tiết món ăn.
- Thêm sản phẩm, số lượng và topping vào giỏ hàng.
- Lưu giỏ hàng theo từng tài khoản hoặc theo khách vãng lai trên `localStorage`.
- Quản lý nhiều địa chỉ giao hàng và số điện thoại.
- Đặt hàng với phương thức:
  - Thanh toán khi nhận hàng — COD.
  - Thanh toán bằng VietQR.
- Áp dụng mã giảm giá khi đặt hàng.
- Theo dõi lịch sử và trạng thái đơn hàng.
- Hủy đơn hàng khi đơn còn ở trạng thái `pending`.
- Đánh giá sản phẩm sau khi đơn hàng đã được giao.
- Chat với chatbot qua Socket.IO hoặc REST API fallback.
- Nhận thông báo cập nhật trạng thái đơn hàng theo thời gian thực.

### Dành cho quản trị viên

- Truy cập dashboard riêng với kiểm tra quyền `admin`.
- Quản lý sản phẩm.
- Quản lý topping.
- Quản lý mã giảm giá.
- Xem và cập nhật trạng thái đơn hàng.
- Xác nhận hoặc hủy các giao dịch VietQR đang chờ.
- Xem thống kê doanh thu, số lượng đơn hàng và sản phẩm đã bán.
- Nhận thông báo đơn hàng mới qua Socket.IO.

## Công nghệ sử dụng

### Frontend

- **React 18** — xây dựng giao diện người dùng.
- **Create React App / react-scripts** — môi trường chạy và build frontend.
- **React Router DOM 6** — điều hướng giữa các trang.
- **Axios** — gọi REST API.
- **Socket.IO Client** — kết nối real-time với backend.
- **Tailwind CSS** — xây dựng giao diện và hệ thống màu.
- **React Hot Toast** — hiển thị thông báo.
- **React Icons** — biểu tượng giao diện.
- **QRCode** — hỗ trợ hiển thị dữ liệu QR.
- **Moment** — xử lý và định dạng thời gian.

### Backend

- **Node.js** và **Express 4** — xây dựng HTTP API.
- **MongoDB** và **Mongoose** — lưu trữ dữ liệu.
- **JSON Web Token** — xác thực người dùng.
- **Passport** — hỗ trợ Google OAuth và Facebook OAuth.
- **Socket.IO** — giao tiếp real-time cho chatbot và thông báo đơn hàng.
- **bcryptjs** — mã hóa mật khẩu.
- **Nodemailer** — gửi email.
- **Google Generative AI** — tích hợp Gemini cho chatbot.
- **Natural** — phân tích từ khóa và xử lý fallback chatbot.
- **VietQR / QR code** — tạo và xử lý thanh toán qua mã QR.
- **dotenv** — đọc cấu hình từ file môi trường.

## Kiến trúc tổng thể

```text
food-ordering/
├── backend/                         # REST API, MongoDB và Socket.IO server
│   ├── config/                      # Kết nối database và cấu hình dịch vụ
│   ├── controllers/                 # Business logic cho từng nghiệp vụ
│   ├── middleware/                  # Xác thực JWT và phân quyền admin
│   ├── models/                      # Mongoose schemas/models
│   ├── routes/                      # Khai báo các endpoint API
│   ├── utils/                       # Email, chatbot, Gemini, VietQR, Passport
│   ├── server.js                    # Entry point backend
│   ├── package.json                 # Backend scripts và dependencies
│   └── .env.example                 # Mẫu biến môi trường backend
│
├── frontend/                       # Ứng dụng React
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # Header, Footer, chat, cart, product...
│   │   ├── context/                 # AuthContext và ChatContext
│   │   ├── pages/                   # Các màn hình user/admin
│   │   ├── utils/                   # Axios API client và Socket.IO client
│   │   ├── App.js                   # Router và protected routes
│   │   ├── index.js                 # Điểm mount React application
│   │   └── index.css                # CSS toàn cục
│   ├── package.json                 # Frontend scripts và dependencies
│   ├── tailwind.config.js           # Cấu hình Tailwind CSS
│   └── .env.example                 # Mẫu biến môi trường frontend
│
├── .gitignore
└── README.md
```

## Flow hoạt động của hệ thống

### 1. Khởi động backend

Entry point là `backend/server.js`.

Khi server khởi động, hệ thống:

1. Đọc biến môi trường bằng `dotenv`.
2. Khởi tạo Gemini service nếu có cấu hình AI.
3. Kết nối MongoDB thông qua `config/db.js`.
4. Khởi tạo Express app.
5. Cấu hình JSON body parser, URL-encoded parser, CORS và cookie parser.
6. Khởi tạo Passport.
7. Đăng ký các nhóm API route.
8. Tạo HTTP server và gắn Socket.IO.
9. Lắng nghe request tại cổng `PORT`, mặc định là `5000`.

Các nhóm API chính:

```text
/api/auth
/api/reset-password
/api/products
/api/orders
/api/users
/api/chat
/api/reviews
/api/toppings
/api/vietqr
/api/sepay
/api/coupons
```

Health check:

```text
GET /api/health
```

### 2. Xác thực và phân quyền

Frontend lưu JWT token và thông tin người dùng trong `localStorage`. Các request cần xác thực được tạo thông qua `authAPI` trong `frontend/src/utils/api.js`.

`authAPI` tự động:

1. Đọc token từ `localStorage`.
2. Gắn token vào header:

   ```http
   Authorization: Bearer <token>
   ```

3. Gửi request đến backend.
4. Tự động xóa token và chuyển về `/login` nếu nhận HTTP `401`.

Ở backend, middleware `protect` trong `backend/middleware/auth.js`:

1. Đọc Bearer token từ request.
2. Xác minh token bằng `JWT_SECRET`.
3. Tìm user trong MongoDB.
4. Gắn user vào `req.user`.
5. Cho phép controller tiếp tục xử lý.

Middleware `admin` kiểm tra:

```javascript
req.user.role === 'admin'
```

Nếu không có quyền, API trả về HTTP `403`.

### 3. Flow frontend và routing

`frontend/src/index.js` mount component `App` vào DOM. `App.js` bao bọc ứng dụng bằng:

- `AuthProvider` — quản lý user, token, profile và cart.
- `BrowserRouter` — quản lý routing.
- `Toaster` — hiển thị thông báo.
- `ChatBot` — giao diện chatbot.

Các route công khai:

```text
/                    Trang chủ và thực đơn
/login               Đăng nhập
/register            Đăng ký
/forgot-password     Quên mật khẩu
/reset-password/:token
/oauth-success       Kết quả OAuth
/about               Giới thiệu
```

Các route yêu cầu đăng nhập:

```text
/cart                Giỏ hàng
/payment             Thanh toán
/qr-payment          Thanh toán VietQR
/profile             Hồ sơ người dùng
/orders              Lịch sử đơn hàng
/change-password     Đổi mật khẩu
```

Route yêu cầu quyền admin:

```text
/admin               Dashboard quản trị
```

`ProtectedRoute` trong `App.js` kiểm tra trạng thái loading, user và quyền admin trước khi cho phép truy cập.

### 4. Flow giỏ hàng

Giỏ hàng được quản lý tập trung trong `AuthContext`:

1. Người dùng chọn sản phẩm trên trang chủ.
2. `addToCart()` thêm sản phẩm, số lượng và topping.
3. Giỏ hàng được lưu trong `localStorage`.
4. Khách chưa đăng nhập sử dụng key `cart_guest`.
5. Người dùng đã đăng nhập sử dụng key theo user, ví dụ `cart_<userId>`.
6. Khi ứng dụng khởi động lại, `restoreCartWithProducts()` lấy danh sách sản phẩm mới nhất từ API.
7. Dữ liệu sản phẩm trong giỏ được khôi phục dựa trên `productId`.
8. Người dùng có thể chọn/bỏ chọn item, cập nhật số lượng, xóa item hoặc xóa toàn bộ giỏ hàng.

Flow dữ liệu:

```text
Home / Product components
          │
          ▼
AuthContext.addToCart()
          │
          ▼
cart state + localStorage
          │
          ▼
Cart.js
          │
          ▼
Payment.js / QRPayment.js
```

### 5. Flow tạo đơn hàng

API chính:

```http
POST /api/orders
```

Request được bảo vệ bởi middleware `protect`.

Trong `orderController.createOrder()`:

1. Kiểm tra giỏ hàng có item hay không.
2. Kiểm tra địa chỉ giao hàng và số điện thoại.
3. Tìm sản phẩm trong MongoDB để lấy giá hiện tại.
4. Tính tiền sản phẩm theo số lượng.
5. Tính tiền topping theo giá, số lượng topping và số lượng sản phẩm.
6. Tính phí giao hàng:
   - Miễn phí nếu subtotal đạt ngưỡng quy định trong code.
   - Ngược lại áp dụng phí giao hàng.
7. Kiểm tra mã giảm giá nếu người dùng nhập coupon.
8. Kiểm tra trạng thái, thời hạn, quyền sử dụng, số lượt dùng và giá trị đơn tối thiểu của coupon.
9. Tạo `Order` trong MongoDB.
10. Populate thông tin user, product và coupon.
11. Phát sự kiện `newOrder` qua Socket.IO.
12. Trả về thông tin đơn hàng cho frontend.

Mô hình đơn hàng lưu các thông tin chính:

- User đặt hàng.
- Danh sách sản phẩm.
- Số lượng, giá và topping.
- Tổng tiền, phí giao hàng và giảm giá.
- Địa chỉ và số điện thoại.
- Trạng thái đơn hàng.
- Phương thức và trạng thái thanh toán.
- QR code hoặc VietQR transaction nếu có.
- Ghi chú đơn hàng.

### 6. Flow thanh toán

#### COD

Đơn COD được tạo thông qua API order thông thường. Đơn ban đầu có các trạng thái như:

```text
orderStatus: pending
paymentMethod: cod
paymentStatus: pending
```

Admin có thể cập nhật trạng thái đơn qua:

```http
PUT /api/orders/:id/status
```

Các trạng thái hỗ trợ gồm:

```text
pending
confirmed
preparing
shipping
delivering
delivered
cancelled
```

Sau khi cập nhật, backend phát sự kiện `orderStatusUpdate` qua Socket.IO và có thể gửi email thông báo nếu được yêu cầu.

#### VietQR

Flow VietQR gồm các bước chính:

1. Frontend chuyển người dùng đến màn hình QR payment.
2. Backend tạo intent hoặc QR data thông qua route `/api/vietqr`.
3. Người dùng quét mã QR và thực hiện thanh toán.
4. Giao dịch được theo dõi qua model `VietQRTransaction`.
5. SePay webhook có thể gửi thông tin giao dịch đến `/api/sepay`.
6. Backend cập nhật payment/order status.
7. Admin có thể xác nhận hoặc hủy giao dịch đang chờ.

Các route liên quan được định nghĩa trong `routes/vietQR.js`, `routes/sepayWebhook.js` và `routes/orders.js`.

### 7. Flow chatbot

Chatbot hỗ tr�� hai phương thức giao tiếp:

- Socket.IO — phương thức chính cho hội thoại real-time.
- REST API — fallback khi Socket.IO không kết nối được.

Frontend dùng `ChatContext` để:

1. Tạo hoặc khôi phục `sessionId`.
2. Lưu session riêng cho khách hoặc từng user.
3. Tải lịch sử chat từ `/api/chat/history/:sessionId`.
4. Kết nối Socket.IO.
5. Gửi sự kiện `user_message`.
6. Nhận sự kiện `bot_message`.
7. Hiển thị trạng thái loading và lỗi.

Backend xử lý tin nhắn trong `server.js`:

```text
user_message
      │
      ▼
saveMessage(user)
      │
      ▼
Load 10 tin nhắn gần nhất
      │
      ▼
chatbotService.processMessage()
      │
      ├── Gemini AI nếu được bật
      ├── directResponseService
      └── keyword matching fallback
      │
      ▼
saveMessage(bot)
      │
      ▼
bot_message
```

`chatbotService` ưu tiên Gemini API. Nếu Gemini chưa được bật hoặc gặp lỗi, hệ thống chuyển sang phản hồi trực tiếp và cuối cùng dùng xử lý từ khóa với thư viện `natural`.

### 8. Flow quản trị

Admin truy cập `/admin`. `AdminDashboard` tập hợp các màn hình quản trị:

- `ProductManagement` — thêm, sửa, xóa sản phẩm.
- `ToppingManagement` — quản lý topping.
- `CouponManagement` — quản lý coupon.
- `OrderManagement` — xem và cập nhật đơn hàng.
- `RevenueStats` — xem thống kê doanh thu.

Frontend gọi các API cần cả `protect` và `admin`. Backend kiểm tra quyền trước khi thực hiện thao tác.

## Cấu trúc dữ liệu chính

### User

Model `User` hỗ trợ:

- Tên, email, password.
- Vai trò `user` hoặc `admin`.
- Avatar.
- Số điện thoại và địa chỉ cũ để tương thích dữ liệu.
- Nhiều địa chỉ và số điện thoại.
- Google ID và Facebook ID.
- Token reset password.
- Điểm thưởng.

Mật khẩu được hash bằng `bcryptjs` trong hook `pre('save')`.

### Product

Lưu thông tin món ăn như tên, giá, ảnh và các thuộc tính sản phẩm được dùng trong thực đơn.

### Topping

Lưu tên, giá và thông tin topping để người dùng tùy chỉnh món ăn.

### Order

Lưu user, items, giá, topping, địa chỉ, trạng thái đơn, thanh toán, coupon và thông tin VietQR.

### Review

Liên kết user với product và chỉ cho phép đánh giá khi user đã có đơn ở trạng thái `delivered`.

### Coupon

Hỗ trợ mã giảm giá, số tiền giảm, thời hạn, số lượt dùng tối đa, số lượt đã dùng, user được phép sử dụng và giá trị đơn tối thiểu.

### ChatMessage

Lưu lịch sử tin nhắn theo `sessionId`, sender, message, user và timestamp.

## Cài đặt

### Yêu cầu

- Node.js 18 trở lên.
- npm.
- MongoDB local hoặc MongoDB Atlas.
- Tài khoản Google/Facebook OAuth nếu muốn sử dụng đăng nhập mạng xã hội.
- API key Gemini nếu muốn bật chatbot AI.
- Cấu hình VietQR/SePay nếu muốn sử dụng thanh toán QR và webhook.

### Clone repository

```bash
git clone https://github.com/Cuongtutrinh/food-ordering.git
cd food-ordering
```

### Cấu hình backend

```bash
cd backend
cp .env.example .env
npm install
```

Ví dụ `backend/.env` tối thiểu:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/food_ordering
JWT_SECRET=change-this-secret
CLIENT_URL=http://localhost:3000
```

> `config/db.js` sử dụng biến `MONGODB_URI`. Vì vậy, nên khai báo `MONGODB_URI` trong file `.env`, dù file mẫu hiện tại có thể đang dùng tên `DB_URL`.

Các biến tích hợp tùy chọn có thể cần bổ sung tùy theo code trong repository:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
GEMINI_API_KEY=
```

Nếu dùng email, VietQR hoặc SePay, hãy kiểm tra các file trong `backend/utils`, `backend/config` và các route tương ứng để bổ sung đúng biến môi trường.

### Cấu hình frontend

Mở terminal khác:

```bash
cd frontend
cp .env.example .env
npm install
```

Nội dung tối thiểu:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Chạy ứng dụng ở môi trường development

### Chạy backend

```bash
cd backend
npm run dev
```

Hoặc chạy bằng Node.js trực tiếp:

```bash
npm start
```

Backend mặc định chạy tại:

```text
http://localhost:5000
```

Kiểm tra server:

```bash
curl http://localhost:5000/api/health
```

### Chạy frontend

Mở terminal khác:

```bash
cd frontend
npm start
```

Frontend mặc định chạy tại:

```text
http://localhost:3000
```

### Chạy đồng thời

Có thể mở hai terminal:

```bash
# Terminal 1
cd backend
npm run dev
```

```bash
# Terminal 2
cd frontend
npm start
```

## Build frontend

```bash
cd frontend
npm run build
```

Thư mục build được tạo tại `frontend/build/`.

## API tiêu biểu

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
PUT  /api/auth/reset-password/:token
PUT  /api/auth/change-password
GET  /api/auth/google
GET  /api/auth/facebook
```

### Products

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products          # admin
PUT    /api/products/:id      # admin
DELETE /api/products/:id      # admin
```

### Orders

```text
POST /api/orders
GET  /api/orders/my-orders
GET  /api/orders              # admin
GET  /api/orders/:id          # admin
PUT  /api/orders/:id/status   # admin
POST /api/orders/:id/cancel
GET  /api/orders/stats        # admin
```

### Reviews, toppings và coupons

```text
/api/reviews
/api/toppings
/api/coupons
```

Các route chi tiết được tổ chức trong thư mục `backend/routes`.

## Bảo mật và cấu hình production

Trước khi deploy production:

- Thay `JWT_SECRET` bằng secret đủ dài và bảo mật.
- Không commit file `.env`.
- Cấu hình `CLIENT_URL` đúng domain frontend.
- Chỉ cho phép CORS từ các origin tin cậy.
- Kiểm tra cấu hình cookie, CSRF và HTTPS.
- Bảo vệ API webhook bằng chữ ký hoặc secret tương ứng.
- Không ghi log mật khẩu hoặc dữ liệu nhạy cảm.
- Kiểm tra lại OAuth callback URL.
- Dùng MongoDB có authentication và network restriction.
- Không đưa API key Gemini, OAuth secret hoặc thông tin thanh toán vào frontend.

## Lưu ý kỹ thuật hiện tại

- `backend/config/db.js` đọc `MONGODB_URI`, trong khi `backend/.env.example` đang minh họa `DB_URL`; cần thống nhất tên biến.
- `server.js` đăng ký một số middleware như `express.json()` và `express.urlencoded()` nhiều lần; có thể đơn giản hóa.
- Route `/api/users` được đăng ký hai lần trong `server.js`; nên kiểm tra và giữ lại một khai báo phù hợp.
- Health check `/api/health` xuất hiện hai lần trong `server.js`.
- Cấu hình CSRF hiện được khởi tạo nhưng middleware bảo vệ đang comment.
- Một số tính năng thanh toán và chatbot phụ thuộc vào biến môi trường, dịch vụ bên ngoài và cấu hình production.
- Cần kiểm tra các controller QR payment để bảo đảm service được import đúng trước khi sử dụng.
- Cần bổ sung test tự động cho auth, order calculation, coupon, VietQR webhook và phân quyền admin.
- Nên bổ sung tài liệu API hoặc OpenAPI/Swagger khi hệ thống phát triển thêm.

## Cải tiến đề xuất

- Tạo workspace hoặc script root để cài đặt và chạy frontend/backend đồng thời.
- Thống nhất toàn bộ biến môi trường trong `.env.example`.
- Thêm validation request bằng Joi, Zod hoặc express-validator.
- Chuẩn hóa format response và error code của API.
- Tách cấu hình production/development.
- Bổ sung pagination và filtering cho products, orders và reviews.
- Thêm transaction hoặc cơ chế chống race condition khi cập nhật coupon và thanh toán.
- Thêm rate limiting cho login, reset password và chatbot.
- Bổ sung test unit/integration/e2e.
- Thêm CI để chạy lint, test và build frontend.
- Đưa file binary, log, build output và dữ liệu nhạy cảm ra khỏi Git nếu không cần thiết.

## Scripts

### Backend

```bash
npm start       # Chạy server bằng Node.js
npm run dev     # Chạy server với nodemon
npm run seed    # Chạy seed script nếu repository có seed.js
```

### Frontend

```bash
npm start       # Chạy development server
npm run build   # Build production
npm test        # Chạy test của Create React App
npm run eject   # Eject cấu hình CRA, chỉ dùng khi thực sự cần
```

## Giấy phép

Repository hiện chưa khai báo giấy phép. Nếu dự án được chia sẻ, phân phối hoặc sử dụng trong sản phẩm khác, nên bổ sung file `LICENSE` phù hợp.
