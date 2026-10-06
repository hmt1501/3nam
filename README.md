# Chuyên án: Giải cứu kỷ niệm 3 năm

Website tĩnh, chạy trực tiếp trên trình duyệt, không cần backend hay cài thư viện.

## Chạy thử

- Mở `index.html` bằng trình duyệt để xem nhanh.
- Hoặc mở Terminal tại thư mục này và chạy `python -m http.server 8000`, sau đó vào `http://localhost:8000`.

## Cá nhân hóa nội dung

Mọi chữ hiện trên web nằm trong [`config.js`](config.js): tên, biệt danh, ngày bắt đầu (`relationshipStart`, dùng để đếm số ngày), câu hỏi, tật xấu, hồ sơ hai người, dòng thời gian, vật phẩm trong game, lời nhắn cuối và thư mời hẹn.

Mỗi câu hỏi có `answer` (vị trí đáp án đúng, `-1` nếu chỉ tính câu tự gõ), `fact` (chuyện thật, hiện sau khi trả lời) và tùy chọn `other`. Có `other` thì câu hỏi có thêm ô **Khác** để tự gõ; câu gõ được tính đúng nếu chứa một trong các cụm trong `other`, không phân biệt hoa thường hay có dấu (ví dụ `"com tam"` khớp với “Cơm tấm sườn”). Để trống `dateNight` thì phần thư mời tự ẩn.

Trò chơi (`game`) là chém món ăn: `good` là món của Tân (chém được điểm), `bad` là món của Linh (chém nhầm mất mạng); chỉnh `time`, `lives`, `target` để đổi độ khó. Mỗi món có `img` (ảnh sticker, mặc định lấy từ Microsoft Fluent Emoji qua jsDelivr) và `icon` dự phòng khi ảnh không tải được. Muốn dùng ảnh riêng thì chép vào `images/` rồi điền `img: "images/ten-anh.png"`.

Để thêm ảnh, tạo thư mục `images` cạnh `index.html`, chép ảnh vào đó, rồi điền đường dẫn tương ứng vào `image` của cột mốc hoặc `sharedPhoto`. Ví dụ: `images/hen-dau.jpg`. Để thêm lời thoại, đặt tệp âm thanh trong `images` hoặc thư mục riêng và điền `voiceUrl`; để thêm bài hát, điền liên kết vào `songUrl`. Có thể để trống các trường media.

## Đưa lên mạng để chia sẻ

**Cách nhanh với Netlify Drop:** đăng nhập Netlify, mở trang Netlify Drop, rồi kéo thả thư mục dự án này (gồm `index.html`, `styles.css`, `app.js`, `config.js` và `images` nếu có). Netlify sẽ cấp một địa chỉ website để gửi cho người nhận.

**Hoặc dùng GitHub Pages:** tạo repository GitHub, tải các tệp trong thư mục này lên nhánh `main`, vào **Settings → Pages**, chọn triển khai từ nhánh `main` và thư mục `/ (root)`, rồi lưu. Khi GitHub Pages hoàn tất, địa chỉ website sẽ hiện trong phần Pages.

Trong dự án này, workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) kiểm tra cú pháp JavaScript và đóng gói website tĩnh. Mỗi lần push lên nhánh mặc định, GitHub Actions tự triển khai bản mới lên Pages; có thể xem tiến độ tại tab **Actions**. Muốn kiểm tra bản mới trên điện thoại hoặc máy khác, lưu thay đổi, commit và push, rồi mở cùng địa chỉ Pages sau khi workflow kết thúc.

Website đang chạy tại **https://hmt1501.github.io/3nam/** (repo: https://github.com/hmt1501/3nam).

### Tự động deploy sau mỗi lần sửa

- **Khi Claude Code sửa code:** hook `Stop` trong [`.claude/settings.json`](.claude/settings.json) chạy [`scripts/auto-deploy.sh`](scripts/auto-deploy.sh) mỗi khi Claude trả lời xong — tự `git add`, commit và push, Pages cập nhật sau khoảng 1 phút.
- **Khi bạn tự sửa file:** chạy `powershell -ExecutionPolicy Bypass -File scripts\watch-deploy.ps1` và để cửa sổ đó mở; mỗi lần lưu file, sau 5 giây không có thay đổi mới nó sẽ tự commit + push.
- Hoặc chạy tay: `bash scripts/auto-deploy.sh`.

Mở link trên điện thoại / máy khác; nếu chưa thấy bản mới, kéo để tải lại (trình duyệt có thể cache vài phút).
