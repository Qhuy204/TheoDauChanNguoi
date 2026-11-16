# Thiết kế đã duyệt

Bốn frame được duyệt: trang mở đầu, timeline, kho tư liệu (bản đã bỏ chi tiết Lăng ở minh họa năm 1945), học tập và làm theo Bác.

Màu chủ đạo: đỏ #A5232B, trắng ngà #FFFCF5, vàng #D7AB48, xanh #466653, chữ #26312D. Font Noto Serif kết hợp Be Vietnam Pro. Giao diện dùng đường timeline, khoảng trống, hình lớn và chú thích rõ ràng. Điều hướng dính; 7 chương đọc liên tục; kho tư liệu có lọc; phần kết là album và gợi ý việc nhỏ.

## Prompt tạo tranh bằng imagegen tích hợp

Các ảnh được tạo riêng theo frame tham chiếu, xuất lại định dạng WebP để giảm dung lượng, không chỉnh sửa nội dung tranh bằng mã.

1. **hero.webp**: “Standalone web hero artwork, no website, no text, no logo, no UI. Landscape 3:2. Preserve warm watercolor style and character likeness from the approved hero frame. Elderly Ho Chi Minh with recognizable face, white pointed beard, gentle smile and ivory khaki tunic on the left; a wooden stilt house above a green lotus pond on the right. Leafy sunlight, moss green, ocher highlights, fine paper texture. Respectful educational illustration.”
2. **harbor.webp**: “Standalone landscape 3:2 watercolor illustration matching the approved timeline frame. No text, dates or interface. A young Vietnamese man age 21, plain beige shirt, cloth cap and satchel, looks across Saigon harbor in 1911. Nhà Rồng red-roof building and early 1900s French steamship in middle distance. Warm morning light, sepia gold and moss green, hopeful mood. An educational illustration.”
3. **activities.webp**: “Only the three-image art album from the approved activities frame. No UI, typography or school logo. Landscape 2:1. Large left image of four Vietnamese primary children reading together in a sunlit school library; top right collecting paper for recycling; bottom right watering plants. White school shirts, red scarves, warm polished illustrative style and natural anatomy. Generic school setting.”
4. **village.webp**: “Standalone landscape 3:2 watercolor. No text or logos. A peaceful late 19th-century Nghệ An village with a thatched bamboo house, fence, garden, path, small lotus pond and tall bamboo. No modern objects. Warm morning sun, moss green, golden ocher, ivory highlights, fine paper grain. A generic illustrative rural scene, not an exact documentary reconstruction.”

5. **learning.webp**: “Standalone landscape 3:2 warm watercolor, no text, people or interface. A simple wooden desk by a window with an open blank old book, black pen, notebook and brown travel satchel. Leafy shadows, ivory paper, ochre wood, moss green and crimson bookmark. Symbolic illustration of perseverance in learning; not a historically verified desk or object.”

## Nội dung trên màn hình nhỏ

Header có menu thu gọn, ảnh hero chuyển xuống dưới tiêu đề. Timeline tổng quan trượt ngang; mục lục chương dùng ô chọn dính. Các mốc sự kiện và ảnh xếp một cột. Kho tư liệu giữ hai cột thẻ gọn; các việc làm ở phần kết mở bằng disclosure. Chuyển động tắt khi người dùng bật giảm chuyển động.
