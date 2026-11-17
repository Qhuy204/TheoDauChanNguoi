# Rà soát câu chữ và UX/UI

## Câu chữ đã sửa

- Thay các tiêu đề gợi cảm xúc nhưng ít thông tin bằng nội dung cụ thể: “Một chuyến đi, một ước mơ” → “Làm phụ bếp trên tàu”; “Gieo một mầm xanh” → “Tết trồng cây”.
- Phần cuối trang dùng “Học tập và làm theo Bác”; bỏ khẩu hiệu “Việc nhỏ hôm nay, ước mơ lớn ngày mai”.
- Rút gọn phần mở đầu từng giai đoạn; kể theo người, việc, địa điểm và thời gian. Bỏ các câu tự nhận xét như “Hành trình ấy cho chúng ta thấy…”.
- Thay bảy câu rút ra bài học chung chung bằng câu hỏi ngắn có thể trao đổi trên lớp. Các việc học sinh có thể làm được đặt ở phần cuối, kèm hành động rõ ràng.
- Tên phim giữ đúng tên tại nguồn, thay vì đặt thêm một tiêu đề mang tính khẩu hiệu.
- Bỏ các nhãn lặp không giúp chọn tư liệu, như “Ảnh và nguồn: xem trong tư liệu”. Thông tin nguồn đầy đủ vẫn có trong hộp xem và cuối trang.

## Vấn đề và cách xử lý

1. **Mục lục và chú thích quá nhỏ ở màn hình vừa.** Tăng cỡ chữ; đoạn giới thiệu lịch sử 18px, mô tả sự kiện 16px. Nhãn nguồn là thông tin phụ.
2. **Sidebar làm hẹp nội dung trên máy tính bảng.** Từ 940px trở xuống dùng thanh chọn giai đoạn dính; ở máy tính bảng ảnh và sự kiện vẫn có thể nằm cạnh nhau.
3. **Chọn chương để lại khoảng trống quá lớn và sai chương đang đọc.** Loại bỏ phần bù trùng giữa scroll-padding và scroll-margin. Chương được chọn nằm dưới header và thanh chọn, có vị trí nhất quán.
4. **Cuộn chuyển chương dài và làm trạng thái đang đọc nhảy qua nhiều giai đoạn.** Chuyển trực tiếp đến chương được chọn; giữ chuyển động nhẹ ở nút và ảnh.
5. **Trở về ô chọn để chuyển từng chương hơi mất công.** Thêm nút giai đoạn trước/tiếp theo với vùng bấm 44px, có trạng thái vô hiệu hóa ở hai đầu.
6. **Tên đơn vị khó đọc trên điện thoại.** Tăng chữ và cho phép xuống dòng; điều chỉnh độ rộng để không đẩy menu ra ngoài màn hình.
7. **Mọi gợi ý việc làm đều bị đóng.** Mở sẵn nhóm đầu để người đọc thấy loại nội dung bên trong; các nhóm còn lại có dấu mở rộng.
8. **Menu bốn mục bị chật ở 768px.** Dùng menu thu gọn từ màn hình máy tính bảng, giữ vùng bấm lớn.

## Kiểm tra

Đã kiểm tra trình duyệt ở 360px, 768px và 1366px; đối chiếu chiều rộng nội dung với clientWidth để phát hiện tràn ngang. Đã thử mở chuyện/ảnh, đóng bằng Escape và trả focus, bộ lọc, tải thêm tư liệu, chọn chương, menu, phát phim từ hochiminh.vn và dọn trình phát khi đóng. Cần kiểm tra lại các breakpoint sau mỗi lần đổi bố cục.

## Giới hạn nội dung

Website chưa có ảnh hoạt động thực tế của Trường Tiểu học Gia Lâm. Album cuối là tranh minh họa, có chú thích. Phim phụ thuộc đường truyền và địa chỉ của đơn vị cung cấp; luôn có liên kết mở trang nguồn. Đây chưa phải kết quả thử nghiệm trực tiếp với học sinh hoặc giáo viên tại trường.

## Chỉnh sửa tiếp theo theo góp ý

- Bỏ các đoạn giải thích dài về AI, phục dựng và cách cắt ảnh khỏi giao diện đọc. Chỉ giữ chú thích ảnh ngắn; nguồn và giấy phép ảnh tập trung ở mục cuối trang.
- Bỏ khối nguồn ở cuối hộp câu chuyện, hộp ảnh và các liên kết nguồn lặp lại dưới từng chương. Liên kết mở phim gốc vẫn có để dùng khi trình phát không tải được.
- Viết lại đủ 7 câu chuyện, mỗi chuyện 5 đoạn, khoảng 250–280 từ theo cách đếm khoảng trắng; bổ sung diễn biến cụ thể và đối chiếu nguồn.
- Thay tham chiếu Trường Tiểu học Khương Mai bằng nội dung dành cho Trường Tiểu học Gia Lâm; không dùng ảnh hoặc hoạt động của trường khác để gắn tên Gia Lâm.
- Thay toàn bộ hoa sen đang dùng trong giao diện và favicon bằng hai ảnh PNG tạo theo ảnh tham chiếu.

## Rà soát căn chỉnh với subagent

- Khối năm và chức danh ở hero bị đặt tuyệt đối trên vùng đệm thấp hơn chiều cao thật của chữ, làm dòng cuối chạm ảnh. Chuyển khối chữ về luồng bố cục bình thường; đo được khoảng cách 18px ở 1366px và 16px ở 768px.
- Logo chính thức của Gia Lâm được giữ nguyên ảnh gốc, hiển thị vuông 76px trên desktop/tablet và 52px trên điện thoại. Bỏ bộ lọc đảo màu của logo cũ ở footer; giá trị kiểm tra là `filter: none`.
- Logo mới khiến tên website xuống hai dòng trên điện thoại, làm header thực tế cao 106px trong khi các thanh dính dùng mốc 89px. Điều chỉnh cỡ chữ tên website và khoảng cách logo/chữ; đo lại tại 360px cho kết quả header 89px, tên trên một dòng, cách menu 10px.
- Đã đối chiếu `scrollWidth` và `clientWidth`: 1351/1351 ở viewport 1366px, 753/753 ở 768px, 345/345 ở 360px; không có tràn ngang. Subagent sửa CSS và rà cascade; root thực hiện kiểm tra trình duyệt do IAB của subagent không khả dụng.

## Dropdown theo giao diện website

- Thay hai menu chọn giai đoạn bằng combobox tùy chỉnh: nền ngà, mũi tên đỏ, viền focus vàng và dấu chọn rõ ràng. Mỗi lựa chọn tách năm và tên chặng thành hai dòng để đọc được đầy đủ.
- Menu hiển thị ngoài thanh dính để tránh bị cắt; tự mở lên hoặc xuống theo khoảng trống và giới hạn chiều rộng theo màn hình. Giữ select gốc làm nguồn giá trị và sự kiện cho điều hướng, bộ lọc và nút đặt lại.
- Đã thử chọn bằng chuột, phím mũi tên, Home/End, Enter, Tab và Escape; điều hướng chặng trả focus về nội dung, bộ lọc cập nhật đúng danh sách. Escape giữ nguyên giá trị. Kiểm tra menu ở 360px và 1366px cho thấy không tràn ngang; đây chưa phải kiểm thử với trình đọc màn hình thực tế.
