// Initial links supplied in the school's reference website; staff can replace this list.
export const defaultResourceLinks=[
 {id:'cong-thong-tin-ho-chi-minh',title:'Cổng thông tin Hồ Chí Minh',description:'Tìm đọc về cuộc đời, sự nghiệp, tác phẩm và những bài học về Bác.',url:'https://hochiminh.vn/'},
 {id:'bao-tang-ho-chi-minh',title:'Bảo tàng Hồ Chí Minh',description:'Khám phá ảnh, hiện vật và những câu chuyện được Bảo tàng giới thiệu.',url:'https://baotanghochiminh.vn/'},
 {id:'tu-lieu-van-kien-dang',title:'Tư liệu – Văn kiện Đảng',description:'Tra cứu văn kiện, tác phẩm và tư liệu về Chủ tịch Hồ Chí Minh.',url:'https://tulieuvankien.dangcongsan.vn/'},
];
export function withResourceLinks(content){return {...content,resourceLinks:content.resourceLinks??defaultResourceLinks.map(link=>({...link}))};}
