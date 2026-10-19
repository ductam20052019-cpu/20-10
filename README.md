# Tiny — Chúc mừng ngày 20/10

Bản sao giao diện và tương tác từ https://20-10-vuive.kazvndc-edu.workers.dev/, theo yêu cầu của chủ dự án. Giữ câu chuyện Tiny, 13 đoạn lời thoại, hoa, sao, cỏ bốn lá, nhạc, video, máy bay chia sẻ và 9 món quà. Giữ các liên kết sản phẩm và phần ghi công của trang gốc.

Ảnh, video, nhạc và phông chữ được lưu trong dự án. Trang không cần gọi website gốc hoặc Google Fonts để hoạt động. Nút chia sẻ sao chép địa chỉ của bản đang chạy, thay vì địa chỉ website gốc.

## Chạy dự án

Cần Node.js 22 trở lên. Chạy từ thư mục gốc của dự án:

```sh
npm run dev
```

Máy chủ lắng nghe trên cổng **3000**. Đổi cổng bằng `PORT=8080 npm run dev`. Không cần cài thư viện để chạy trang; không có bước build và không cần khóa API hay cơ sở dữ liệu.

Nhấp hoặc chạm vào nền để chuyển cảnh. Nhạc bắt đầu khi trình duyệt cho phép hoặc sau lần tương tác đầu tiên. Phần mở đầu chờ đủ **9,7 giây nhạc** trước khi cho chuyển sang câu “ui cậu đẹp quá”, giống trang gốc. Ở cuối câu chuyện, bấm **Đồng ý** để sao chép liên kết và cho máy bay cất cánh, rồi chạm nền để mở gian quà tặng.

## Chỉnh sửa

- `index.html`: lời chúc, SVG, sản phẩm, liên kết và ghi công.
- `styles/site.css`: toàn bộ giao diện, hiệu ứng và bố cục điện thoại.
- `scripts/story.js`: chuyển cảnh, mắt Tiny, nhạc, lời bài hát, sao chép liên kết.
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

`npm test` kiểm tra phục vụ trang/tài nguyên, phát từng đoạn âm thanh/video và giới hạn tệp công khai. Kiểm tra trình duyệt đi qua câu chuyện, chia sẻ và hộp thoại sản phẩm ở kích thước máy tính và điện thoại. Nếu máy đã có Chromium hệ thống, dùng `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser` để tránh tải trình duyệt khác.

## Đưa lên hosting tĩnh

Đưa `index.html`, `favicon.svg`, `assets/`, `styles/` và các tệp `scripts/*.js` lên hosting tĩnh có HTTPS. Không cần đưa máy chủ phát triển, thư mục kiểm tra hoặc `node_modules` lên hosting. Các đường dẫn tài nguyên là tương đối, dùng được cả khi đặt trang trong thư mục con.
