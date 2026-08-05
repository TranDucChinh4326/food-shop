# Cau truc frontend FoodHub

Repo này chỉ chứa frontend tĩnh để deploy lên Cloudflare Pages.

## Trang người dùng

- `index.html`: trang chủ.
- `menu.html`: hiển thị món ăn, do uong va cac danh mục con.
- `cart.html`: giỏ hàng va đặt hàng.
- `track.html`: lịch sử đơn hàng của tài khoản đăng nhập.
- `announcements.html`: danh sách thông báo he thong.
- `contact.html`: liên hệ.
- `profile.html`: hồ sơ va liên kết tài khoản.

## Đăng nhập

- `login.html`, `register.html`, `verify-email.html`: giao dien xác thực.
- `assets/css/auth.css`: giao dien auth.
- `assets/js/auth.js`, `assets/js/verify-email.js`: logic auth.

## Quản trị

- `admin.html`: tong quan va cac khu quản lý chung.
- `admin-food.html`: them, sửa món ăn.
- `admin-account.html`: them, sửa tài khoản.
- `admin-announcement.html`: them, sửa thông báo.
- `assets/css/admin.css`: giao dien quản trị.
- `assets/js/admin/`: logic rieng của admin.

## Tai san dung chung

- `assets/css/style.css`: giao dien website khách hàng.
- `assets/js/script.js`: header, giỏ hàng, menu, thông báo, quảng cáo, chat box.
- `assets/js/profile.js`: hồ sơ người dùng.
- `config.js`: địa chỉ API backend va mã OAuth.
