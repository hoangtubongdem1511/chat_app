# Messenger App

Ứng dụng chat real-time xây dựng với **Next.js App Router**, **Prisma**, **MongoDB**, **Pusher**, **NextAuth**, **Cloudinary**, **LiveKit.io** và **Tailwind CSS**.

## Tính năng
- **Chat 1-1 và nhóm real-time** với Pusher Channels
- **Video call chất lượng cao** với LiveKit.io (WebRTC)
- **Hiển thị trạng thái online/offline** (presence)
- **Hiển thị đã xem/chưa xem tin nhắn** real-time
- **Đăng nhập xác thực** (NextAuth) - Email, Google, GitHub
- **Cập nhật hồ sơ & avatar** (Cloudinary upload)
- **Giao diện responsive** (hỗ trợ mobile & desktop)
- **Quản lý cuộc gọi** - tạo, tham gia, kết thúc cuộc gọi
- **Thông báo cuộc gọi đến** real-time

## Công nghệ sử dụng
- [Next.js 15+ App Router](https://nextjs.org/) - Framework React
- [Prisma ORM](https://www.prisma.io/) + MongoDB - Database
- [Pusher Channels](https://pusher.com/channels) - Real-time messaging & notifications
- [LiveKit.io](https://livekit.io/) - WebRTC video/audio calls
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Cloudinary](https://cloudinary.com/) - Image upload & management
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## Hướng dẫn cài đặt

### 1. Cài đặt package
```bash
npm install
```

### 2. Tạo file môi trường `.env`
Tạo file `.env` ở thư mục gốc với nội dung mẫu:
```env
# Database
DATABASE_URL="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Pusher (Real-time messaging)
PUSHER_APP_ID=your_pusher_app_id
NEXT_PUBLIC_PUSHER_APP_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster

# Cloudinary (Image upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# LiveKit (Video calls)
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
```

### 3. Khởi tạo Prisma
```bash
npx prisma generate
npx prisma db push
```

### 4. Chạy server phát triển
```bash
npm run dev
```
Truy cập [http://localhost:3000](http://localhost:3000)


## Lưu ý
- **Pusher**: Đảm bảo app key, secret, cluster đúng và đã bật presence channel.
- **Cloudinary**: Đảm bảo upload preset `chat-app` đã được tạo và cho phép unsigned upload.
- **LiveKit**: Cần tạo tài khoản LiveKit.io và lấy API key/secret.
- **Tailwind**: Đã cấu hình content đúng cho thư mục `app/`.
- **NextAuth**: Đã cấu hình provider phù hợp (email, Google, GitHub).

## Scripts
- `npm run dev` — Chạy server phát triển
- `npm run build` — Build production
- `npm start` — Chạy production

## 📸 Screenshots

### Login
<img src="/public/images/login.png" width="100%" alt="login">

### Friend
<img src="/public/images/friend.png" width="100%" alt="friend">

### Chat
<img src="/public/images/chat.png" width="100%" alt="chat">

### Group chat
<img src="/public/images/groupchat1.png" width="100%" alt="groupchat1">
<img src="/public/images/groupchat2.png" width="100%" alt="groupchat2">
<img src="/public/images/detail.png" width="100%" alt="detail">

### Profile
<img src="/public/images/profile.png" width="100%" alt="profile">

### Call
<img src="/public/images/call1.png" width="100%" alt="call1">
<img src="/public/images/call2.png" width="100%" alt="call2">
<img src="/public/images/call3.png" width="100%" alt="call3">


## License
MIT
