# Sáng mãi tên Người

Website hành trình của Chủ tịch Hồ Chí Minh và bài viết của Trường Tiểu học Gia Lâm.

- Trang hành trình: /, nội dung và tài sản gốc trong public/.
- Bài viết công khai: /bai-viet, /bai-viet/[slug].
- Đăng nhập email/mật khẩu: /dang-nhap, dùng Supabase Auth, không dùng ChatGPT để đăng nhập.
- Quản lý: /quan-ly. Giáo viên sửa và đăng bài của mình; admin quản lý mọi bài và quyền các hồ sơ đã được cấp.
- Lưu nháp, đăng/gỡ bài, xem trước; ảnh JPG/PNG/WebP tối đa 5 MB; kiểm tra phiên bản khi lưu để tránh ghi đè.
- Trình soạn thảo Tiptap: đậm, nghiêng, gạch chân/ngang, tiêu đề, danh sách, trích dẫn, liên kết và hoàn tác. Nội dung có định dạng lưu thành JSON có tiền tố richtext:v1: trong cột body; máy chủ chỉ chấp nhận các node/mark được phép, bài cũ vẫn đọc và sửa được.
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

npm run check kiểm tra nội dung gốc và 18 trường hợp API/định dạng: quyền truy cập, cookie, CSRF, xung đột phiên bản, ảnh, lưu định dạng, tương thích bài cũ và nội dung không an toàn. tests/cms-rls.sql kiểm tra RLS trong transaction rollback, không giữ dữ liệu thử.

## Supabase

Đặt NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY trong .dev.vars (không commit) khi chạy local, và trong biến môi trường Sites khi triển khai. Xem .env.example.

Không đặt mật khẩu database hoặc service-role key trong source. Runtime dùng publishable key cùng JWT của người đăng nhập. Mật khẩu PostgreSQL chỉ dùng để quản trị schema ngoài runtime.

Áp dụng supabase/migrations/202611170001_cms.sql một lần bằng SQL Editor hoặc PostgreSQL client có xác minh chứng chỉ. Có hai bảng cms_profiles, cms_posts và bucket riêng tư cms-media. Thay đổi schema về sau bằng migration mới.

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
