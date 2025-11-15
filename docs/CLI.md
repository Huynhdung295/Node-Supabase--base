# 🎨 CLI Guide - Tạo Code Tự Động

## 🚀 Interactive CLI (Như NestJS)

```bash
npm run create
```

### Chọn Loại Resource

```
? What would you like to create?
  > Complete Resource (Controller + Route + Migration)
    Controller only
    Route only
    Service
    Middleware
    Migration
```

### Nhập Tên

```
? Resource name (singular, lowercase): post
```

### Kết Quả

```
✅ Migration created
✅ Service created
✅ Controller created
✅ Route created

📝 Next steps:
1. Edit migration SQL
2. npm run migration:up
3. Register route in src/routes/index.js
4. Test in Swagger
```

## 📝 Ví Dụ

### Tạo Blog System

```bash
npm run create  # post
npm run create  # comment
npm run create  # category
```

### Tạo E-commerce

```bash
npm run create  # product
npm run create  # order
npm run create  # cart
```

### Tạo Social Network

```bash
npm run create  # post
npm run create  # like
npm run create  # follow
```

## ⚡ Time Savings

- **Manual**: 40 phút
- **With CLI**: 3 phút
- **Saved**: 93%!

## 🎯 Workflow

1. **Create resource**: `npm run create`
2. **Edit migration**: `supabase/migrations/*.sql`
3. **Apply migration**: `npm run migration:up`
4. **Register route**: `src/routes/index.js`
5. **Test**: Swagger UI

## 📚 Commands

```bash
# Interactive CLI
npm run create

# Non-interactive
npm run generate:controller post
npm run generate:route post

# Migration
npm run migration:new add_posts
npm run migration:up
```

---

**Tạo features trong 30 giây!** ⚡
