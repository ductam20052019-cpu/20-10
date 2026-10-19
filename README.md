# Tiny — Chúc mừng ngày 20/10



Ảnh, video, nhạc và phông chữ được lưu trong dự án. Trang không cần gọi website gốc hoặc Google Fonts để hoạt động. Phần kết là một món quà riêng: nạp can đảm, máy bay giao thư, mở lời nhắn và cất quà.

## Chạy dự án

Cần Node.js 22 trở lên. Chạy từ thư mục gốc của dự án:

```sh
npm run dev
```

Máy chủ lắng nghe trên cổng **3000**. Đổi cổng bằng `PORT=8080 npm run dev`. Không cần cài thư viện để chạy trang; không có bước build và không cần khóa API hay cơ sở dữ liệu.

Nhấp hoặc chạm vào nền để chuyển cảnh. Nhạc bắt đầu khi trình duyệt cho phép hoặc sau lần tương tác đầu tiên. Phần mở đầu chờ đủ **9,7 giây nhạc** trước khi cho chuyển sang câu “ui cậu đẹp quá”.

Ở cuối câu chuyện:

1. Bấm **Nhận quà 💌**: pin tăng từ 80% lên 100% cùng dòng “Đang nạp thêm một chút can đảm…”.
2. Máy bay cất cánh, kéo theo “Điểm đến: chỗ cậu ✈️”, rồi giao phong thư.
3. Bấm **Mở thư** để đọc lời nhắn riêng và phần kết “Là cậu đó.”.
4. Bấm **Cất vào túi ♡**: hiện “Đã giao tận tay người tớ muốn tặng.”.

Phần kết không yêu cầu sao chép/chia sẻ liên kết và không tự chuyển sang gian hàng. Nút dùng được bằng chuột, chạm, Tab/Enter; chế độ giảm chuyển động vẫn giao thư đầy đủ.

## Chỉnh sửa

- `index.html`: lời chúc, SVG, sản phẩm, liên kết và ghi công.
- `styles/site.css`: toàn bộ giao diện, hiệu ứng và bố cục điện thoại.
- `styles/gift.css`: giao diện hành trình nhận quà và phong thư.
- `scripts/story.js`: chuyển cảnh, mắt Tiny, nhạc, lời bài hát và chuyến bay giao quà.
- `scripts/gift-letter.js`: mở phong thư, đọc lời nhắn và cất quà.
- Các tệp khác trong `scripts/`: hoa, hạt sáng, vườn hoa, gian quà tặng và tối ưu hiệu ứng.
- `assets/`: ảnh, nhạc, video và phông chữ. Phông Courier Prime kèm giấy phép trong `assets/fonts/OFL.txt`.

Các script chạy theo thứ tự trong HTML và dùng chung trạng thái của câu chuyện; giữ thứ tự khi chỉnh sửa. Không đổi chúng thành `async` hoặc ES module mà chưa điều chỉnh các biến dùng chung.

## Kiểm tra

```sh
npm test
npm ci
npx playwright install chromium
npm run test:browser
```

`npm test` kiểm tra phục vụ trang/tài nguyên, phát từng đoạn âm thanh/video và giới hạn tệp công khai. Kiểm tra trình duyệt đi qua câu chuyện, pin tăng từ 80% lên 100%, chuyến bay giao thư và kết thúc nhận quà ở kích thước máy tính và điện thoại. Nếu máy đã có Chromium hệ thống, dùng `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser` để tránh tải trình duyệt khác.

## Đưa lên hosting tĩnh

Đưa `index.html`, `favicon.svg`, `assets/`, `styles/` và các tệp `scripts/*.js` lên hosting tĩnh có HTTPS. Không cần đưa máy chủ phát triển, thư mục kiểm tra hoặc `node_modules` lên hosting. Các đường dẫn tài nguyên là tương đối, dùng được cả khi đặt trang trong thư mục con.
