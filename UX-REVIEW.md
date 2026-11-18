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

## Khung xem tư liệu

- Bỏ thanh nhãn loại tư liệu và tiêu đề đỏ lớn phía trên ảnh. Ảnh nằm trước, tên và chú thích căn trái ở dưới; khung vuông nhẹ, không làm mờ hậu cảnh, không bo góc ảnh và không cắt nội dung ảnh.
- Dùng nút “Đóng” có chữ và biểu tượng, luôn nằm ở đầu khung khi cuộn. Hộp chuyện có chiều rộng đọc tối đa 640px; câu hỏi cuối chuyện dùng đường phân cách, bỏ ô nền màu. Khung phim dùng cùng cách trình bày.
- Đã kiểm tra ảnh, chuyện và phim; ảnh ở 360px và 1366px không tràn ngang hoặc bị cắt. Đã thử cuộn chuyện trên điện thoại, giữ nút đóng trong màn hình, vòng Tab trong dialog, Escape, trả focus về nút mở và gỡ trình phát khi đóng. `npm run check` đạt.

## Đăng nhập và bài viết

- Giữ trang hành trình gốc trong `public/`; thêm trang bài viết, đăng nhập Supabase Auth bằng email/mật khẩu và khu vực quản lý. Giao diện dùng lại màu, font và logo của trường.
- Bài mặc định là bản nháp, có xem trước, đăng/gỡ công khai và ảnh đại diện. Giáo viên quản lý bài của mình; admin quản lý mọi bài và quyền các hồ sơ khác. Cảnh báo khi rời nội dung chưa lưu và kiểm tra phiên bản khi lưu.
- Đã kiểm tra 12 trường hợp API, typecheck và build. Kiểm tra RLS trực tiếp trên Supabase bằng transaction rollback đã qua: khách không đọc bản nháp, giáo viên không đọc nháp/sửa bài của người khác hoặc tự nâng quyền, có thể đăng bài của mình.
- Kiểm tra trình duyệt: trang đăng nhập, trang bài viết trống, chuyển khách chưa đăng nhập về trang đăng nhập, thông báo sai mật khẩu và màn hình 360px không tràn ngang. Chưa kiểm tra toàn bộ thao tác qua trình duyệt bằng tài khoản thật trước khi admin đầu tiên được chỉ định và cấp hồ sơ.

## Trình soạn thảo và bài viết trên trang chủ

- Thay textarea Markdown bằng Tiptap với thanh công cụ cùng màu website: đậm, nghiêng, gạch chân/ngang, tiêu đề mục/nhỏ, hai loại danh sách, trích dẫn, liên kết, hoàn tác và xóa định dạng. Chèn link qua ô nhập trong editor; không dùng hộp prompt của trình duyệt.
- Dùng cấu trúc JSON được kiểm tra ở máy chủ, hiển thị qua React; không chèn HTML do người viết gửi vào. Chặn URL script, thuộc tính HTML tùy ý, node không hỗ trợ và nội dung quá lớn. Đếm phần chữ thực khi kiểm tra điều kiện đăng bài. Bài văn bản cũ được chuyển sang cấu trúc editor khi mở.
- Thêm vùng Bài viết mới ngay sau tổng quan hành trình: tối đa ba bài đã đăng, ảnh đại diện nếu có, tên bài, tác giả, ngày, mô tả ngắn và liên kết đọc. Có trạng thái trống, lỗi/tải lại và xem toàn bộ bài viết.
- Đã kiểm tra bằng tài khoản admin thật trên preview: tạo nháp, định dạng đậm/tiêu đề/danh sách/link, lưu, tải lại và xem trước vẫn giữ nguyên. Editor không tự đánh dấu chưa lưu lúc khởi tạo hoặc sau khi lưu. Kiểm tra 360px: toolbar xuống dòng, không tràn ngang; bản nháp không xuất hiện trong vùng trang chủ. Dữ liệu thử được dọn sau kiểm tra.

## Biên tập nội dung website và ảnh trong bài

- `/noi-dung` có các nhóm Giới thiệu, Hành trình, Kho ảnh, Câu chuyện, Thước phim, Làm theo Bác và Nguồn tham khảo. Nội dung đọc từ Supabase; có thêm/xóa/sắp xếp, chọn ảnh từ kho hoặc tải từ máy, lưu nháp và xuất bản riêng. Không gọi API theo mỗi lần gõ.
- `/quan-ly` dùng bố cục soạn báo với tiêu đề lớn, đoạn mở đầu và phần nội dung rộng. Bỏ trường đường dẫn và vùng ảnh đại diện; server tự tạo slug, giữ đường dẫn khi sửa. Nút Thêm ảnh chèn figure ngay tại con trỏ, có chú thích và hoàn tác. Ảnh đầu bài tự dùng ở danh sách.
- Đã tải ảnh thật trong editor, sửa chú thích, lưu nháp, tải lại và xem trước thành công. Kiểm tra quyền và xung đột tại cả API lẫn Supabase RLS. Nội dung nháp thử được khôi phục; phép thử xuất bản chỉ dùng nội dung và liên kết ảnh giống hệt bản gốc đã duyệt.
- Nội dung công khai có cache client, gộp yêu cầu, ETag/304 và cache Worker; phần quản lý/nháp không cache. Các thiết bị khác có thể thấy bản cũ trong thời hạn cache được ghi trong README.

## Header chung và lối vào đăng nhập

- Trang chủ, bài viết, đăng nhập và quản lý dùng chung `public/header.css`: cùng logo, dòng đơn vị, chiều cao, chiều rộng, đường kẻ vàng và menu Giới thiệu/Hành trình/Tư liệu/Làm theo Bác/Bài viết. Giữ chỗ thanh cuộn để header không dịch ngang giữa trang dài và trang ngắn.
- Nút Đăng nhập nền đỏ nằm ngoài menu thu gọn, luôn hiện trên điện thoại. Menu có trạng thái mở/đóng, Escape trả focus về nút, liên kết đóng menu khi chọn.
- Đã kiểm tra màn hình 360 px và 1366 px: logo và chữ có cùng kích thước giữa trang chủ/bài viết, nút đăng nhập dẫn tới đúng trang, menu dùng được và không tràn ngang. Typecheck và kiểm tra nội dung đạt.

## Rà lỗi phiên đăng nhập và biên tập

- Header lấy trạng thái phiên thực, hiện Quản lý sau đăng nhập; đăng xuất, chuyển tab và quay lại bằng lịch sử cập nhật lại trạng thái. Trang đã đăng nhập tự rời form login, vào Nội dung website. Header/trang quản lý gộp truy vấn phiên, không cache công khai hay lưu token vào trình duyệt ngoài cookie HttpOnly.
- Trang chủ có lối Thêm, sửa hành trình/Tư liệu/Việc làm dành cho giáo viên/admin; mở đúng nhóm thay vì chỉ dẫn tới quản lý bài viết. Menu hoạt động độc lập ngay cả khi kho nội dung tải chậm hoặc lỗi.
- Sửa lỗi header sticky che nút lưu/xuất bản và toolbar khi cuộn. Đã xác nhận bằng hit-test DOM và thao tác bấm: thanh công cụ nằm dưới header.
- Cho phép lưu bản nháp phim/nguồn mới chưa có đường dẫn, vẫn chặn xuất bản thiếu thông tin và URL nguy hiểm. Chặn xóa mục còn được tham chiếu với thông báo cụ thể. Chuẩn hóa số trang về số nguyên hữu hạn và trả 400 khi JSON đầu vào không phải object.
- Thử trên preview bằng tài khoản thật: thêm/sửa/lưu chặng, thêm/sửa/lưu câu chuyện, tải lại giữ nội dung; thêm phim nháp chưa có URL, lưu thành công. Các mục thử đã xóa khỏi bản nháp; không xuất bản dữ liệu thử. Luồng đăng xuất/đăng nhập lại và header trang chủ đạt. 34 kiểm tra tự động và typecheck đạt.

## Ổn định nhãn đăng nhập

- Bỏ nhãn chờ Tài khoản. Header server truyền trạng thái hiển thị ban đầu; trang chủ chuyển mẫu HTML ra khỏi thư mục asset để không bỏ qua bước render này. Trang có phiên không được cache chung.
- Store tách trạng thái authenticated/anonymous khỏi refreshing/error. Kiểm tra nền, focus và lỗi mạng giữ nguyên nhãn. Chỉ login, logout hoặc xác minh phiên hết hạn mới đổi nhãn; phản hồi cũ không thắng trạng thái mới. Không đổi trạng thái đăng nhập vì lỗi thiếu quyền của một thao tác riêng.
- Đã thử chuyển trang chủ → bài viết → quản lý → tải lại trên preview: cả bốn lần đều hiện Quản lý từ đầu; đăng xuất đổi đúng một lần về Đăng nhập. HTML trả về trước khi chạy script đã có đúng nhãn. Thêm kiểm tra race, mạng lỗi, xác minh phiên và HTML ban đầu; tổng 38 kiểm tra và typecheck đạt.

## Menu chức năng quản lý

- Đổi nút Quản lý từ liên kết vào trình biên tập thành menu thả xuống có tám chức năng. Trang chủ và các trang khác dùng cùng danh sách và cách đóng menu. Chọn mục nội dung mở đúng `?muc=...`; liên kết sửa tại từng khu vực vẫn mở thẳng phần tương ứng.
- Đã bấm mở menu trên trang bài viết mà URL không đổi, chọn Hành trình mở đúng ô Tên chặng, thử Escape và màn hình 360 px (menu nằm trong viewport, không tràn ngang). Giữ nhãn đăng nhập ổn định trong lúc kiểm tra phiên nền.
- Bổ sung method POST và chờ form sẵn sàng trước khi cho bấm đăng nhập, tránh submit GET mặc định nếu người dùng bấm trước khi JavaScript khởi tạo xong.

## Liên kết sang các trang tư liệu

- Đối chiếu mục thư viện trong bản tham khảo do người dùng gửi; bổ sung ba liên kết Cổng thông tin Hồ Chí Minh, Bảo tàng Hồ Chí Minh và Tư liệu – Văn kiện Đảng vào khu vực Tư liệu. Liên kết có tên, lời giới thiệu ngắn, dấu mở trang ngoài và mở ở thẻ mới.
- Thêm nhóm Liên kết tư liệu trong CMS/menu Quản lý; hỗ trợ tên, mô tả, URL, thêm/xóa/sắp xếp, lưu nháp và xuất bản. Giữ riêng với phần Nguồn tham khảo của các chặng để không làm thay đổi các tham chiếu hiện có. Không ghi đè dữ liệu người dùng hoặc đổi schema.
- Đã kiểm tra ba URL tại trang nguồn, kiểm tra target/rel trong DOM, ô sửa và nút thêm của CMS; màn hình 360 px không tràn ngang. Hai kiểm tra mới xác nhận lưu sửa/danh sách rỗng và chặn URL không an toàn, ID trùng, liên kết thiếu khi xuất bản. Tổng 40 kiểm tra và typecheck đạt.
