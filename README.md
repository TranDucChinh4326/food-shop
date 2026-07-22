# FoodHub Frontend

Frontend HTML/CSS/JavaScript tinh cho FoodHub.

## Cau truc file

```text
food-shop/
  index.html                 Trang chu
  menu.html                  Thuc don
  cart.html                  Gio hang
  track.html                 Lich su don hang
  announcements.html         Danh sach thong bao
  login.html/register.html   Dang nhap, dang ky
  admin*.html                Cac trang quan tri
  config.js                  Cau hinh API va OAuth
  assets/
    css/                     CSS chung, auth, admin
    js/                      JS chung, auth, profile
    js/admin/                JS rieng cho trang quan tri
  docs/                      Ghi chu cau truc va van hanh
```

Giu cac file `.html` o thu muc goc de URL Cloudflare Pages khong bi doi.

## Chay local

Mo truc tiep `index.html` hoac dung Live Server.

Backend local mac dinh:

```js
window.FOODHUB_CONFIG = {
  API_BASE_URL: "http://localhost:3000/api"
};
```

## Deploy Cloudflare Pages

1. Upload folder `food-shop` len GitHub.
2. Tao Cloudflare Pages project tu repo GitHub.
3. Sau khi co backend domain, sua `config.js`:

```js
window.FOODHUB_CONFIG = {
  API_BASE_URL: "https://api.your-domain.com/api"
};
```

4. Deploy lai Cloudflare Pages.
