function renderSharedFooter() {
  document.querySelectorAll("[data-shared-footer]").forEach(slot => {
    slot.outerHTML = `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <a class="footer-logo" href="index.html">FoodHub</a>
        <p>Nền tảng giao đồ ăn hiện đại, kết nối khách hàng với thực đơn tươi ngon, thanh toán linh hoạt và theo dõi đơn hàng minh bạch.</p>
        <div class="footer-contact-list">
          <span>Hotline: <a href="tel:0123456789">0123 456 789</a></span>
          <span>Email: <a href="mailto:foodhub@gmail.com">foodhub@gmail.com</a></span>
          <span>Giờ phục vụ: 08:00 - 22:00 hằng ngày</span>
        </div>
        <div class="footer-socials" aria-label="Kênh liên hệ FoodHub">
          <a href="index.html" aria-label="Website FoodHub" title="Website"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.5 3.4 5.5 3.4 9S14.2 18.5 12 21c-2.2-2.5-3.4-5.5-3.4-9S9.8 5.5 12 3Z"/></svg></a>
          <a href="mailto:foodhub@gmail.com" aria-label="Email FoodHub" title="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg></a>
          <a href="tel:0123456789" aria-label="Hotline FoodHub" title="Hotline"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 4.5 6 6.8c-.7.7-.7 1.8-.2 2.7a25 25 0 0 0 8.7 8.7c.9.5 2 .5 2.7-.2l2.3-2.5-3.7-3-1.8 1.8c-1.9-.9-3.4-2.4-4.3-4.3l1.8-1.8-3-3.7Z"/></svg></a>
        </div>
      </div>
      <div class="footer-links">
        <div>
          <h3>Khám phá</h3>
          <a href="index.html">Trang chủ</a>
          <a href="menu.html">Thực đơn</a>
          <a href="menu.html?category=food">Đồ ăn</a>
          <a href="menu.html?category=drink">Đồ uống</a>
        </div>
        <div>
          <h3>Khách hàng</h3>
          <a href="cart.html">Giỏ hàng</a>
          <a href="track.html">Lịch sử đơn</a>
          <a href="profile.html">Hồ sơ cá nhân</a>
          <a href="announcements.html">Thông báo</a>
          <a href="vouchers.html">Voucher</a>
        </div>
        <div>
          <h3>Hỗ trợ</h3>
          <a href="contact.html">Trung tâm hỗ trợ</a>
          <a href="feedback.html">Gửi phản hồi</a>
          <a href="contact.html">Hợp tác cửa hàng</a>
          <a href="contact.html">Liên hệ FoodHub</a>
        </div>
        <div>
          <h3>Cam kết</h3>
          <span>Món ăn cập nhật từ hệ thống</span>
          <span>Kiểm tra tồn kho khi đặt hàng</span>
          <span>Theo dõi trạng thái đơn</span>
          <span>Hỗ trợ COD, QR và VNPay</span>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 FoodHub Delivery. All rights reserved.</p>
        <p>Designed by Tran Duc Chinh IT</p>
      </div>
    </div>
  </footer>`;
  });
}

renderSharedFooter();
