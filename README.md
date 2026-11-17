# Sáng mãi tên Người

Website hành trình của Chủ tịch Hồ Chí Minh và bài viết của Trường Tiểu học Gia Lâm.

- Trang hành trình: /, đọc nội dung đã xuất bản từ Supabase. public/data/content.json chỉ là bản khởi tạo, không phải dữ liệu cố định khi chạy.
- Bài viết công khai: /bai-viet, /bai-viet/[slug].
- Đăng nhập email/mật khẩu: /dang-nhap, dùng Supabase Auth, không dùng ChatGPT để đăng nhập.
- Quản lý: /quan-ly. Giáo viên sửa và đăng bài của mình; admin quản lý mọi bài và quyền các hồ sơ đã được cấp.
- Biên tập website: /noi-dung. Giáo viên/admin sửa giới thiệu, các chặng và mốc hành trình, ảnh, câu chuyện, thước phim, việc làm theo Bác và nguồn tham khảo; thêm, xóa, sắp xếp mục, lưu nháp rồi xuất bản. Bản nháp tách khỏi nội dung công khai; lưu/xuất bản kiểm tra revision để tránh ghi đè.
- Lưu nháp, đăng/gỡ bài, xem trước; ảnh JPG/PNG/WebP tối đa 5 MB; kiểm tra phiên bản khi lưu để tránh ghi đè.
- Trình soạn thảo Tiptap: đậm, nghiêng, gạch chân/ngang, tiêu đề, danh sách, trích dẫn, liên kết và hoàn tác. Nội dung có định dạng lưu thành JSON có tiền tố richtext:v1: trong cột body; máy chủ chỉ chấp nhận các node/mark được phép, bài cũ vẫn đọc và sửa được.
- Soạn bài theo bố cục tiêu đề, đoạn mở đầu và nội dung. Đường dẫn tự tạo từ tiêu đề, tự xử lý trùng và giữ nguyên khi sửa bài. Chèn nhiều ảnh tại con trỏ bằng nút Thêm ảnh, kéo thả hoặc dán ảnh; có chú thích từng ảnh. Không cần lưu nháp trước, không có vùng tải ảnh đại diện riêng. Ảnh đầu bài tự làm hình xem trước ở danh sách.
- Ảnh lớn được thu về tối đa 1600 px và WebP khi có lợi trước khi tải lên; máy chủ vẫn kiểm tra định dạng/dung lượng. File gốc được chọn tối đa 20 MB, file tải lên tối đa 5 MB. Ảnh nháp chỉ người có quyền xem được.
- Trang chủ có vùng Bài viết mới sau phần tổng quan hành trình, hiển thị ba bài công khai mới nhất từ Supabase. Bản nháp không xuất hiện; trạng thái trống/lỗi và tải lại hoạt động độc lập với timeline.

## Chạy và kiểm tra

Node >=22.13.0. Dùng starter Sites/Vinext với Worker phía máy chủ, giữ nguyên HTML/CSS/JS trang hành trình.

```powershell
npm ci
npm run dev
npm run check
npm run typecheck
npm run build
```

Preview: http://127.0.0.1:5173. npm start xem bản build bằng Wrangler. Server tĩnh không chạy phần đăng nhập/quản lý.

npm run check kiểm tra nội dung gốc và 27 trường hợp API/định dạng/cache: quyền truy cập, cookie, CSRF, xung đột phiên bản, ảnh, lưu định dạng, tương thích bài cũ, liên kết nội dung và nội dung không an toàn. tests/cms-rls.sql kiểm tra RLS, slug, liên kết ảnh và xuất bản trong transaction rollback, không giữ dữ liệu thử.

## Bộ nhớ đệm

Trang chủ giữ bản nội dung công khai trong localStorage và bộ nhớ, dùng lại trong 30 giây; khi cũ sẽ hiển thị bản đang có và kiểm tra cập nhật nền bằng ETag. Các yêu cầu đồng thời được gộp. Khi giáo viên xuất bản, tab cùng trình duyệt được báo cập nhật; nội dung hành trình có nút tải lại, danh sách bài tự làm mới. Không lưu phiên đăng nhập hay bản nháp vào cache này.

API công khai dùng bộ nhớ giới hạn 128 mục/30 giây, gộp truy vấn đang chạy và ETag/304. Worker Cache API chỉ được dùng khi hosting cho phép; bản Sites hiện tại chặn cache mặc định nên tự dùng bộ nhớ và cache trình duyệt, không báo lỗi. JSON: max-age 30 giây, stale-while-revalidate 60 giây; ảnh đã công khai: trình duyệt 1 giờ, s-maxage 24 giờ khi có edge cache. Lưu/xuất bản xóa cache liên quan trên isolate hiện tại. Isolate/thiết bị khác có thể còn thấy bản cũ trong thời hạn cache; đây không phải đồng bộ tức thì toàn cầu. API quản lý và ảnh nháp luôn private/no-store.

## Supabase

Đặt NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY trong .dev.vars (không commit) khi chạy local, và trong biến môi trường Sites khi triển khai. Xem .env.example.

Không đặt mật khẩu database hoặc service-role key trong source. Runtime dùng publishable key cùng JWT của người đăng nhập. Mật khẩu PostgreSQL chỉ dùng để quản trị schema ngoài runtime.

Áp dụng các migration trong supabase/migrations theo thứ tự 001 đến 005, mỗi migration một lần, bằng SQL Editor hoặc PostgreSQL client có xác minh chứng chỉ. Schema gồm hồ sơ, bài viết, ảnh/liên kết ảnh và tài liệu nội dung draft/published; bucket cms-media riêng tư. Khởi tạo hai tài liệu từ public/data/content.json một lần, không ghi đè nội dung đã biên tập. Thay đổi schema về sau bằng migration mới.

Tạo tài khoản trong Supabase → Authentication → Users → Add user. Dùng email/mật khẩu do nhà trường cấp, xác nhận email theo quy trình của trường. Website không có tự đăng ký công khai.

Sau khi user tồn tại, cấp hồ sơ qua SQL Editor (thay đúng email, tên và quyền):

```sql
insert into public.cms_profiles(id, display_name, role)
select id, 'Tên giáo viên', 'teacher'
from auth.users where lower(email) = lower('email-da-duoc-cap@truong.edu.vn')
on conflict(id) do update set display_name=excluded.display_name,
  role=excluded.role, active=true;
```

Với admin đầu tiên, dùng role admin. Admin có thể đổi quyền/khóa quyền đăng của hồ sơ khác trên website, không tự đổi quyền/khóa chính mình. Cấp tài khoản mới trong Supabase Auth trước, rồi thêm hồ sơ. User đăng ký trực tiếp qua Supabase cũng không có quyền viết nếu thiếu hồ sơ được cấp.

Supabase Auth xử lý mật khẩu; website giữ token trong cookie HttpOnly, Secure trên HTTPS, SameSite=Lax. API xác minh user và quyền mỗi lần; RLS kiểm tra tiếp tại database. Ảnh bản nháp không có URL bucket công khai.

## Triển khai

Giữ nguyên project ID và đối tượng công khai trong .openai/hosting.json. dist/ là kết quả build; nguồn trang hành trình chuyển sang public/. Không chỉnh dist/.

Theo workflow Sites: check/typecheck/build, source helper commit/push/đóng gói, lưu phiên bản rồi deploy. Binding D1/R2 để null vì dùng Supabase. Hosting manifest không chứa thông tin đăng nhập.

Repo: https://github.com/Qhuy204/TheoDauChanNguoi.git. GitHub lưu mã nguồn; tên miền hiện tại được xuất bản qua Sites.
