# Messenger App

Ứng dụng chat real-time xây dựng với **Next.js App Router**, **Prisma**, **MongoDB**, **Pusher**, **NextAuth**, **Cloudinary** và **Tailwind CSS v4**.

## Tính năng
- Chat 1-1 và nhóm real-time
- Hiển thị trạng thái online/offline (presence)
- Hiển thị đã xem/chưa xem tin nhắn
- Đăng nhập xác thực (NextAuth)
- Cập nhật hồ sơ & avatar (Cloudinary upload)
- Giao diện responsive (hỗ trợ mobile & desktop)

## Công nghệ sử dụng
- [Next.js 15+ App Router](https://nextjs.org/)
- [Prisma ORM](https://www.prisma.io/) + MongoDB
- [Pusher Channels](https://pusher.com/channels) (real-time)
- [NextAuth.js](https://next-auth.js.org/) (xác thực)
- [Cloudinary](https://cloudinary.com/) (upload ảnh)
- [Tailwind CSS v4](https://tailwindcss.com/)

## Hướng dẫn cài đặt

### 1. Cài đặt package
```bash
npm install
```

### 2. Tạo file môi trường `.env`
Tạo file `.env` ở thư mục gốc với nội dung mẫu:
```env
DATABASE_URL="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

PUSHER_APP_ID=your_pusher_app_id
NEXT_PUBLIC_PUSHER_APP_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER= ...
NEXT_PUBLIC_PUSHER_CLUSTER= ...

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
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
- **Tailwind v4**: Đã cấu hình content đúng cho thư mục `app/`.
- **NextAuth**: Đã cấu hình provider phù hợp (email, Google, ...).

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


## License
MIT
