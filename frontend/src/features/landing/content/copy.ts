// Toàn bộ chữ hiển thị trên landing. Sửa copy theo feedback ở file này, không sửa trong component.
// Quy tắc: không nêu tên đối tác, chứng chỉ, hay số liệu chưa kiểm chứng.

import type { UnitSize } from "./units"

export const HERO = {
  badge: "✨ Giải pháp lưu kho thông minh 4.0",
  title: "Thảnh thơi dọn phố, rộng chỗ an tâm",
  lead: "Dịch vụ thuê kho tự quản thông minh theo ngày & tháng. Mở khóa 24/7 bằng mã PIN riêng biệt — Giá rõ ràng, an tâm gửi gắm!",
  image: {
    src: "https://images.unsplash.com/photo-1730154838368-c37b1fdebcf6?auto=format&fit=crop&w=1400&q=75",
    srcSet: [640, 960, 1400]
      .map(
        (w) =>
          `https://images.unsplash.com/photo-1730154838368-c37b1fdebcf6?auto=format&fit=crop&w=${w}&q=75 ${w}w`
      )
      .join(", "),
    width: 1400,
    height: 927,
    alt: "Những thùng carton ghi nhãn tay xếp gọn cạnh chậu cây xanh trong căn phòng sáng đèn",
    credit: "Ảnh: Dina Badamshina / Unsplash",
  },
  trust: [
    { icon: "clock", label: "Ra vào 24/7 bằng mã PIN" },
    { icon: "thermometer", label: "Kho mát 22–25°C tại mọi cơ sở" },
    { icon: "shield", label: "Có bảo hiểm tài sản toàn diện" },
  ],
} as const

export type TrustIcon = (typeof HERO.trust)[number]["icon"]

export interface UseCase {
  id: string
  title: string
  body: string
  size: UnitSize
  presetId: EstimatorPresetId
  image?: { src: string; alt: string }
}

export const USE_CASES_SECTION = {
  badge: "Tình huống sử dụng",
  title: "Cần bao nhiêu chỗ, có bấy nhiêu kho",
  lead: "Chọn tình huống phù hợp với bạn, hệ thống thông minh sẽ gợi ý kích cỡ kho vừa vặn tức thì.",
  tryLabel: "Tính thử ngay",
} as const

export const USE_CASES: readonly UseCase[] = [
  {
    id: "moving",
    title: "Dọn nhà sửa tổ, gửi đồ liền tay",
    body: "Gửi tạm toàn bộ nội thất và vật dụng từ vài tuần đến vài tháng, xong việc thảnh thơi dọn về tổ ấm mới.",
    size: "L",
    presetId: "apartment",
    image: {
      src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      alt: "Dọn nhà chuyển tổ ấm",
    },
  },
  {
    id: "seasonal",
    title: "Hết mùa cất lại, rộng rãi cả năm",
    body: "Chăn đông, quạt mát, đồ trang trí Tết, dụng cụ cắm trại: dùng xong cất gọn, giải phóng tối đa không gian sống.",
    size: "S",
    presetId: "suitcase",
    image: {
      src: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      alt: "Đồ dùng theo mùa và đồ gia đình gọn gàng",
    },
  },
  {
    id: "student",
    title: "Về quê nhẹ gánh, tiết kiệm tiền phòng",
    body: "Gửi trọn đồ đạc phòng trọ trong 2–3 tháng hè, không còn nỗi lo gánh nặng chi phí giữ phòng.",
    size: "M",
    presetId: "room",
    image: {
      src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
      alt: "Sinh viên gửi đồ về quê nghỉ hè",
    },
  },
  {
    id: "travel",
    title: "Giấy tờ vali, an toàn từng ly",
    body: "Tủ cá nhân bảo mật cao, camera giám sát 24/7, mở kho lấy đồ bất cứ lúc nào bạn cần.",
    size: "S",
    presetId: "suitcase",
    image: {
      src: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
      alt: "Vali hành lý và hồ sơ an toàn",
    },
  },
  {
    id: "homestay",
    title: "Kinh doanh kho bãi, buôn may bán đắt",
    body: "Nệm êm, đồ cồng kềnh, hàng hóa kinh doanh online: lối đi rộng rãi, xe tải đỗ tận nơi bốc dỡ dễ dàng.",
    size: "XL",
    presetId: "house",
    image: {
      src: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
      alt: "Kho hàng kinh doanh và homestay",
    },
  },
]

export type EstimatorPresetId = "suitcase" | "room" | "apartment" | "house"

export interface EstimatorPreset {
  id: EstimatorPresetId
  label: string
  volumeM3: number
}

export const ESTIMATOR = {
  badge: "Bộ ước tính thông minh",
  title: "Đo đạc nhanh tay, chọn ngay kho chuẩn",
  lead: "Chọn gần đúng lượng đồ hoặc kéo thanh trượt để tính toán không gian vừa vặn và tối ưu chi phí.",
  presets: [
    { id: "suitcase", label: "Vali & Giấy tờ", volumeM3: 1.5 },
    { id: "room", label: "Phòng trọ sinh viên", volumeM3: 5 },
    { id: "apartment", label: "Căn hộ 1–2 phòng ngủ", volumeM3: 11 },
    { id: "house", label: "Nhà phố 3 phòng ngủ", volumeM3: 18 },
  ] satisfies EstimatorPreset[],
  slider: { min: 0, max: 25, step: 0.5, label: "Lượng đồ ước tính (m³)" },
  climateLabel: "Kho mát điều hòa 22–25°C",
  climateHint: "+20% đơn giá, sẵn sàng tại tất cả cơ sở",
  emptyTitle: "Chưa chọn lượng đồ",
  emptyBody: "Hãy chọn một mục nhanh ở trên hoặc kéo thanh trượt để tìm cỡ kho hoàn hảo cho bạn.",
  resultPrefix: "Gợi ý tối ưu cho bạn",
  perMonth: "/ tháng",
  depositLabel: "Tiền cọc đảm bảo",
  overflowTitle: "Cần diện tích lớn hơn 20 m³?",
  overflowBody:
    "Hệ thống luôn có sẵn các phương án ghép nhiều kho linh hoạt nhằm đáp ứng tối đa nhu cầu của bạn.",
} as const

export const PRICING_SECTION = {
  badge: "Bảng giá niêm yết",
  title: "Bảng giá minh bạch, chuẩn sạch không phí ẩn",
  lead: "Bốn cỡ kho linh hoạt, trần cao 2m tiêu chuẩn. Thuê theo ngày tiện lợi, ưu đãi dài hạn theo tháng.",
  perMonth: "/ tháng",
  perDay: "Theo ngày",
  deposit: "Cọc",
  suggested: "Vừa vặn với lượng đồ của bạn",
} as const

export const FACILITIES_SECTION = {
  badge: "Hệ thống cơ sở",
  title: "7 cơ sở hiện đại, khắp mọi nẻo đường",
  lead: "Mạng lưới kho tự quản thông minh phủ sóng tại các vị trí đắc địa, thuận tiện giao thông.",
  climateBadge: "Kho mát",
} as const

export const PROCESS_SECTION = {
  badge: "Quy trình đơn giản",
  title: "4 bước chạm ngay, thuê kho liền tay",
  steps: [
    {
      title: "Chọn kho ưng ý",
      body: "Xem sơ đồ 2D trực quan theo thời gian thực, chọn ô kho còn trống ở vị trí gần bạn nhất.",
    },
    {
      title: "Đặt chỗ tức thì",
      body: "Điền thông tin trực tuyến, xác thực OTP nhanh gọn và thanh toán tiền cọc bảo mật.",
    },
    {
      title: "Mã PIN trao tay",
      body: "Nhận mã PIN mở cửa định danh riêng biệt gửi thẳng về điện thoại ngay sau khi đặt chỗ.",
    },
    {
      title: "Tự do ra vào 24/7",
      body: "Chủ động mang và lấy đồ bất kể ngày đêm hay lễ tết với không gian riêng tư tuyệt đối.",
    },
  ],
} as const

export interface Testimonial {
  quote: string
  name: string
  context: string
}

export const TESTIMONIALS_SECTION = {
  badge: "Cảm nhận khách hàng",
  title: "Khách gửi trọn niềm tin, vẹn tròn trải nghiệm",
  /** true = đánh giá minh họa (chưa có dữ liệu thật). Đổi thành false khi thay bằng đánh giá thật. */
  illustrative: true,
  illustrativeNote: "Đánh giá minh họa",
  items: [
    {
      quote:
        "Sửa nhà ba tháng, tôi gửi hết sofa với tủ sách. Lấy về vẫn sạch bóng, thơm tho không hề có mùi ẩm.",
      name: "Anh Quang Minh",
      context: "Thuê kho L, Quận 7",
    },
    {
      quote:
        "Hè về quê, gửi đồ phòng trọ ở đây vừa an tâm vừa rẻ hơn hẳn tiền giữ phòng. Đầu năm học quay lại lấy rất tiện!",
      name: "Bạn Thu Trang",
      context: "Thuê kho M, Cầu Giấy",
    },
    {
      quote:
        "Mấy bộ máy ảnh chuyên dụng và túi xách da tôi gửi vào kho mát. Đi công tác dài ngày cực kỳ an tâm.",
      name: "Chị Gia Hân",
      context: "Thuê kho mát điều hòa",
    },
  ] satisfies Testimonial[],
} as const

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export const FAQ_SECTION = {
  badge: "Hỏi đáp nhanh",
  title: "Giải đáp tận tâm, an tâm trải nghiệm",
  items: [
    {
      id: "access",
      question: "Tôi có ra vào kho lúc nào cũng được không?",
      answer:
        "Hoàn toàn được! Cửa kho mở tự động bằng mã PIN 24/7/365, kể cả lúc nửa đêm hay ngày lễ tết. Bạn toàn quyền chủ động thời gian của mình.",
    },
    {
      id: "climate",
      question: "Đồ có bị ẩm mốc không? Kho mát có ở đâu?",
      answer:
        "Kho tiêu chuẩn luôn được thông gió thoáng đãng, phù hợp đồ gia dụng và dọn nhà. Kho mát kiểm soát nhiệt độ 22–25°C và độ ẩm tối ưu được trang bị tại tất cả các cơ sở, lý tưởng cho đồ điện tử, thiết bị quay chụp, túi da và tài liệu.",
    },
    {
      id: "duration",
      question: "Thời gian thuê ngắn nhất là bao lâu?",
      answer:
        "Thời gian thuê tối thiểu linh hoạt từ 7 ngày. Bạn có thể thuê theo ngày (7-29 ngày) hoặc theo tháng. Thuê từ 3, 6, 12 tháng được chiết khấu thêm 5%, 10%, 15%.",
    },
    {
      id: "banned",
      question: "Có những mặt hàng nào không được gửi?",
      answer:
        "Để đảm bảo an toàn tuyệt đối, chúng tôi không nhận: thực phẩm tươi sống/đông lạnh, động vật sống, chất dễ cháy nổ, hóa chất nguy hại, vũ khí và các loại hàng hóa thuộc danh mục cấm.",
    },
    {
      id: "booking",
      question: "Đặt kho trực tuyến như thế nào?",
      answer:
        "Rất nhanh chóng! Bạn chỉ cần chọn ô kho trên sơ đồ 2D, xác thực số điện thoại qua OTP và đặt cọc trực tuyến. Toàn bộ quy trình hoàn tất trong 3 phút, không cần xếp hàng tại quầy.",
    },
  ] satisfies FaqItem[],
} as const

export const FINAL_CTA = {
  badge: "Bắt đầu ngay hôm nay",
  title: "Nhà thêm gọn gàng, đón vạn thảnh thơi",
  lead: "Giải phóng không gian sống và trải nghiệm thuê kho thông minh ngay hôm nay. Đặt kho nhanh chóng, nhận trọn ưu đãi!",
} as const

export const FOOTER = {
  tagline: "Hệ thống kho tự quản thông minh hàng đầu, mở cửa 24/7.",
  copyright: "© 2026 Smart Self Storage. All rights reserved.",
} as const
