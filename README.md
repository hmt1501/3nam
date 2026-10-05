# Chuyên án: Giải cứu kỷ niệm 3 năm

Website tĩnh, chạy trực tiếp trên trình duyệt, không cần backend hay cài thư viện.

## Chạy thử

- Mở `index.html` bằng trình duyệt để xem nhanh.
- Hoặc mở Terminal tại thư mục này và chạy `python -m http.server 8000`, sau đó vào `http://localhost:8000`.

## Cá nhân hóa nội dung

Sửa các giá trị trong [`config.js`](config.js). Những nội dung có `[MẪU]` đang chờ thay bằng thông tin thật. Tệp này có tên, biệt danh, ngày kỷ niệm, lời giới thiệu, câu hỏi và đáp án, cáo buộc, lời nút “Không”, cột mốc, vật phẩm trong game, lời nhắn và kế hoạch hẹn.

Để thêm ảnh, tạo thư mục `images` cạnh `index.html`, chép ảnh vào đó, rồi điền đường dẫn tương ứng vào `image` của cột mốc hoặc `sharedPhoto`. Ví dụ: `images/hen-dau.jpg`. Để thêm lời thoại, đặt tệp âm thanh trong `images` hoặc thư mục riêng và điền `voiceUrl`; để thêm bài hát, điền liên kết vào `songUrl`. Có thể để trống các trường media.

## Đưa lên mạng để chia sẻ

**Cách nhanh với Netlify Drop:** đăng nhập Netlify, mở trang Netlify Drop, rồi kéo thả thư mục dự án này (gồm `index.html`, `styles.css`, `app.js`, `config.js` và `images` nếu có). Netlify sẽ cấp một địa chỉ website để gửi cho người nhận.

**Hoặc dùng GitHub Pages:** tạo repository GitHub, tải các tệp trong thư mục này lên nhánh `main`, vào **Settings → Pages**, chọn triển khai từ nhánh `main` và thư mục `/ (root)`, rồi lưu. Khi GitHub Pages hoàn tất, địa chỉ website sẽ hiện trong phần Pages.

Trong dự án này, workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) kiểm tra cú pháp JavaScript và đóng gói website tĩnh. Mỗi lần push lên nhánh mặc định, GitHub Actions tự triển khai bản mới lên Pages; có thể xem tiến độ tại tab **Actions**. Muốn kiểm tra bản mới trên điện thoại hoặc máy khác, lưu thay đổi, commit và push, rồi mở cùng địa chỉ Pages sau khi workflow kết thúc.

Chưa có dịch vụ nào được dùng để triển khai website từ thư mục này.
