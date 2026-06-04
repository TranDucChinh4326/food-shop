# FoodHub Frontend

Frontend HTML/CSS/JavaScript tinh cho FoodHub.

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
