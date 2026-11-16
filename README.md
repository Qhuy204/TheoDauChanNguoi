# Sáng mãi tên Người

Website giáo dục dành cho học sinh tiểu học. Đơn vị: **Chi bộ 2 – Đảng bộ Trường Tiểu học Gia Lâm**.

## Chạy trên máy

Cần Node.js 20 trở lên. Website không có thư viện cần cài đặt.

```powershell
cd G:\BacHo\sang-mai-ten-nguoi
npm run dev
```

Mở <http://127.0.0.1:4173>. Dừng server bằng Ctrl+C. Cần chạy qua HTTP vì nội dung được đọc từ JSON; không mở `index.html` trực tiếp bằng giao thức `file:`.

```powershell
npm run check
```

Lệnh kiểm tra đối chiếu 7 giai đoạn, liên kết dữ liệu, ảnh, nguồn và cú pháp JavaScript.

## Cập nhật nội dung

Sửa `dist/data/content.json`, giữ nguyên cấu trúc JSON và mã định danh đang được tham chiếu.

- `site`: tên website, dòng phụ, đơn vị, tên trường, lời giới thiệu và ảnh đầu trang/hoạt động.
- `stages`: 7 giai đoạn, mốc sự kiện, bài học, giải thích từ khó; thứ tự trong danh sách là thứ tự hiển thị.
- `images`: đường dẫn ảnh, mô tả cho trình đọc màn hình, chú thích, nguồn và giấy phép.
- `stories`: các đoạn kể chuyện, câu hỏi liên hệ, mã giai đoạn và nguồn.
- `videos`: trang nguồn, đường dẫn MP4 được công bố trên trang nguồn, ảnh xem trước và gợi ý xem.
- `activities`: việc làm và gợi ý hành động cho học sinh.
- `sources`: các tài liệu đối chiếu.

Thêm ảnh vào `dist/assets/`, sau đó cập nhật đường dẫn tương ứng. Khi thay album minh họa bằng ảnh của trường, đồng thời sửa chú thích và mô tả trong `dist/index.html`. Chỉ dùng ảnh phù hợp để công bố và thông tin hoạt động đã kiểm chứng. Không gắn ảnh trường khác thành hoạt động của trường mình.

Nội dung không cần tài khoản quản trị, không lưu thông tin học sinh. Mỗi lần sửa cần kiểm tra lại và xuất bản lại bản tĩnh.

## Tư liệu và hình minh họa

Nguồn lịch sử chính: *Hồ Chí Minh – Tiểu sử*, Bảo tàng Hồ Chí Minh, NXB Chính trị Quốc gia, 2008, bản điện tử trên hệ thống Tư liệu – Văn kiện Đảng. Nội dung được kể lại bằng lời ngắn gọn; không phải trích nguyên văn.

Ảnh thật được lưu cục bộ. Thông tin nguồn, tác giả và giấy phép được gom trong mục Nguồn tham khảo cuối trang; hộp câu chuyện chỉ hiển thị ảnh, chú thích ngắn, nội dung và câu hỏi. Ảnh Pác Bó chụp năm 2016. Ảnh chân dung có tên tệp nguồn ghi 1946 nhưng hồ sơ mô tả khoảng năm 1947; website ghi theo phần mô tả. Các ảnh CC BY-SA giữ giấy phép tương ứng.

Phim được phát từ địa chỉ do hochiminh.vn công bố, không sao chép phim vào dự án. Video chỉ tải khi người xem yêu cầu, có liên kết mở trang nguồn khi không phát được. Website sử dụng font Google Fonts; nếu không kết nối được sẽ dùng font dự phòng trên máy.

Năm tranh minh họa AI nằm trong `dist/assets/`: `hero.webp`, `harbor.webp`, `village.webp`, `learning.webp`, `activities.webp`. Đây là minh họa, không phải chứng cứ lịch sử hoặc ảnh hoạt động của trường. Xem `DESIGN.md` để biết hướng tạo tranh và tham chiếu bố cục.

Biểu tượng hoa sen đã thay bằng ảnh PNG nền trong suốt: `lotus-red.png` dùng ở đầu/cuối trang và favicon; `lotus-gold.png` dùng ở các điểm chia phần. Phần giới thiệu hoạt động mang tên Trường Tiểu học Gia Lâm, không liên kết sang trường khác.

## Cấu trúc và triển khai

- `dist/`: toàn bộ website tĩnh để đưa lên hosting.
- `scripts/serve.mjs`: máy chủ xem thử, chỉ nghe trên máy cục bộ.
- `scripts/check.mjs`: kiểm tra nội dung và tệp trước khi xuất bản.
- `.openai/hosting.json`: mã dự án Sites và thư mục xuất bản.

Không có bước build. Upload toàn bộ nội dung `dist/` cho hosting tĩnh, hoặc sử dụng quy trình Sites đã liên kết. Giữ nguyên `project_id` khi xuất bản phiên bản tiếp theo. Bản Sites ban đầu giữ chế độ riêng tư.
