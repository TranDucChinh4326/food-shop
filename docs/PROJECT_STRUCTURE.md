# Cấu trúc frontend FoodHub

Repo này chứa frontend tĩnh để deploy lên Cloudflare Pages.

## Trang người dùng

- `index.html` + `assets/css/index.css`: trang chủ.
- `menu.html` + `assets/css/menu.css`: thực đơn, món ăn và danh mục.
- `food-detail.html` + `assets/css/food-detail.css`: chi tiết món ăn.
- `cart.html` + `assets/css/cart.css`: giỏ hàng và đặt hàng.
- `track.html` + `assets/css/track.css`: lịch sử đơn hàng.
- `announcements.html` + `assets/css/announcements.css`: danh sách thông báo.
- `contact.html` + `assets/css/contact.css`: liên hệ.
- `profile.html` + `assets/css/profile.css`: hồ sơ và liên kết tài khoản.
- `feedback.html` + `assets/css/feedback.css`: phản hồi khách hàng.

## Đăng nhập

- `login.html` + `assets/css/login.css`: đăng nhập.
- `register.html` + `assets/css/register.css`: đăng ký.
- `verify-email.html` + `assets/css/verify-email.css`: xác thực email.
- `assets/js/auth.js`, `assets/js/verify-email.js`: logic xác thực.

## Quản trị

- `admin.html` + `assets/css/admin.css`: tổng quan và các khu quản lý chung.
- `admin-food.html` + `assets/css/admin-food.css`: thêm, sửa món ăn.
- `admin-account.html` + `assets/css/admin-account.css`: thêm, sửa tài khoản.
- `admin-announcement.html` + `assets/css/admin-announcement.css`: thêm, sửa thông báo.
- `assets/js/admin/`: logic riêng của admin.

## CSS

- `assets/css/base.css`: nền chung của các trang khách hàng, header, footer và component dùng lại.
- `assets/css/admin-base.css`: nền chung của khu quản trị.
- `assets/css/auth-base.css`: nền chung của trang đăng nhập, đăng ký và xác thực.
- `assets/css/<ten-trang>.css`: style riêng của từng trang. File có thể rất nhỏ nếu trang đó hiện chỉ dùng style chung.

## Tài sản dùng chung

- `assets/js/script.js`: header, giỏ hàng, menu, thông báo, quảng cáo, chat box.
- `assets/js/profile.js`: hồ sơ người dùng.
- `config.js`: địa chỉ API backend và mã OAuth.
