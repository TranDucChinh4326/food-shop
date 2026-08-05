# FoodHub Frontend

Frontend HTML/CSS/JavaScript tinh cho FoodHub.

## Cau truc file

```text
food-shop/
  index.html                 Trang chủ
  menu.html                  Thực đơn
  cart.html                  Giỏ hàng
  track.html                 Lịch sử đơn hàng
  announcements.html         Danh sách thông báo
  login.html/register.html   Đăng nhập, đăng ký
  admin*.html                Cac trang quản trị
  config.js                  Cau hinh API va OAuth
  assets/
    css/                     CSS chung, auth, admin
    js/                      JS chung, auth, profile
    js/admin/                JS rieng cho trang quản trị
  docs/                      Ghi chu cau truc va van hanh
```

Giữ các file `.html` o thư mục gốc de URL Cloudflare Pages không bị đổi.

## Chay local

Mo truc tiep `index.html` hoặc dung Live Server.

Backend local mac dinh:

```js
window.FOODHUB_CONFIG = {
  API_BASE_URL: "http://localhost:3000/api"
};
```

## Deploy Cloudflare Pages

1. Upload folder `food-shop` len GitHub.
2. Tạo Cloudflare Pages project từ repo GitHub.
3. Sau khi co backend domain, sửa `config.js`:

```js
window.FOODHUB_CONFIG = {
  API_BASE_URL: "https://api.your-domain.com/api"
};
```

4. Deploy lai Cloudflare Pages.
