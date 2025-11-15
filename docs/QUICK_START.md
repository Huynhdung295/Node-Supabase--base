# ⚡ Quick Start - 5 Phút Setup

## 🚀 Bắt Đầu Nhanh

### Bước 1: Install
```bash
npm install
```

### Bước 2: Generate Keys
```bash
npm run keys:generate
npm run keys:append
```

### Bước 3: Start Supabase
```bash
npm run supabase:start
```
**→ Copy `anon key` và `service_role key` vào `.env`**

### Bước 4: Start API
```bash
npm run dev
```

### Bước 5: Test
```
✅ API: http://localhost:3000
✅ Swagger: http://localhost:3000/api-docs
✅ Supabase Studio: http://localhost:54323
```

## 🎯 Test Accounts

```
Admin:     admin@example.com / admin123
User:      user@example.com / user123
Affiliate: aff@example.com / aff123
```

## 🔥 Tạo Feature Mới (30 giây!)

```bash
npm run create
# Chọn: Complete Resource
# Nhập tên: post
# Done!
```

## 📚 Đọc Tiếp

- **docs/CLI.md** - Hướng dẫn CLI
- **docs/TESTING.md** - Hướng dẫn testing
- **docs/DEPLOY.md** - Hướng dẫn deploy
- **docs/API.md** - API examples

## 🆘 Gặp Vấn Đề?

```bash
# Supabase không start
npm run supabase:stop
npm run supabase:start

# Port đã dùng
# Đổi PORT trong .env

# Migration lỗi
npm run supabase:reset
```

---

**That's it! Bắt đầu code thôi!** 🚀
