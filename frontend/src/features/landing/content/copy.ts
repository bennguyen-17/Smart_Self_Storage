// Toàn bộ chữ hiển thị trên landing. Sửa copy theo feedback ở file này, không sửa trong component.
// Quy tắc: không nêu tên đối tác, chứng chỉ, hay số liệu chưa kiểm chứng.

import type { UnitSize } from "./units"

export const HERO = {
  title: "Nhà gọn lại, đồ vẫn ở gần",
  lead: "Thuê kho tự quản theo ngày hoặc theo tháng, ra vào 24/7 bằng mã PIN. Giá niêm yết rõ, đặt online trong vài phút.",
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
    { icon: "thermometer", label: "Kho mát 22–25°C tại Quận 1" },
    { icon: "shield", label: "Có bảo hiểm tài sản" },
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
  title: "Cất gì cũng có chỗ",
  lead: "Chọn tình huống gần với bạn nhất, chúng tôi gợi ý cỡ kho ngay.",
  tryLabel: "Tính thử",
} as const

export const USE_CASES: readonly UseCase[] = [
  {
    id: "moving",
    title: "Chuyển nhà, sửa nhà",
    body: "Gửi tạm nội thất vài tuần đến vài tháng, xong việc thì dọn về.",
    size: "L",
    presetId: "apartment",
    image: {
      src: "https://images.unsplash.com/photo-1714647211902-bb711d643a17?auto=format&fit=crop&w=900&q=70",
      alt: "Cô gái bê thùng carton trong phòng khách đang dọn dẹp để chuyển nhà",
    },
  },
  {
    id: "seasonal",
    title: "Đồ theo mùa",
    body: "Chăn đông, quạt, đồ Tết, đồ cắm trại: dùng vài lần mỗi năm, đừng để chiếm tủ.",
    size: "S",
    presetId: "suitcase",
  },
  {
    id: "student",
    title: "Sinh viên về quê hè",
    body: "Gửi đồ phòng trọ 2–3 tháng, khỏi trả tiền phòng lúc không ở.",
    size: "M",
    presetId: "room",
  },
  {
    id: "travel",
    title: "Vali, túi golf, giấy tờ",
    body: "Tủ cá nhân nhỏ gọn, mở lúc nào cũng được.",
    size: "S",
    presetId: "suitcase",
  },
  {
    id: "homestay",
    title: "Đồ homestay, hàng bán online",
    body: "Nệm, đồ cồng kềnh, hàng tồn: cần chỗ rộng và xe tải vào được.",
    size: "XL",
    presetId: "house",
  },
]

export type EstimatorPresetId = "suitcase" | "room" | "apartment" | "house"

export interface EstimatorPreset {
  id: EstimatorPresetId
  label: string
  volumeM3: number
}

export const ESTIMATOR = {
  title: "Bạn cần kho cỡ nào?",
  lead: "Chọn gần đúng lượng đồ hoặc kéo thanh trượt. Kết quả chỉ để tham khảo, nhân viên sẽ tư vấn thêm nếu cần.",
  presets: [
    { id: "suitcase", label: "Vali và giấy tờ", volumeM3: 1.5 },
    { id: "room", label: "Phòng trọ", volumeM3: 5 },
    { id: "apartment", label: "Căn hộ 1–2 phòng ngủ", volumeM3: 11 },
    { id: "house", label: "Nhà 3 phòng ngủ", volumeM3: 18 },
  ] satisfies EstimatorPreset[],
  slider: { min: 0, max: 25, step: 0.5, label: "Lượng đồ ước tính (m³)" },
  climateLabel: "Kho mát 22–25°C",
  climateHint: "+20% đơn giá, chỉ có tại Quận 1",
  emptyTitle: "Chưa có lượng đồ",
  emptyBody: "Chọn một mục ở trên hoặc kéo thanh trượt để xem cỡ kho phù hợp.",
  resultPrefix: "Gợi ý cho bạn",
  perMonth: "/ tháng",
  depositLabel: "Tiền cọc",
  overflowTitle: "Nhiều hơn một kho XL",
  overflowBody:
    "Hơn 20 m³ thì nên thuê 2 kho, hoặc gọi để chúng tôi xếp phương án gọn nhất.",
} as const

export const PRICING_SECTION = {
  title: "Giá niêm yết, không phí ẩn",
  lead: "Bốn cỡ kho, cùng chiều cao 2 m. Thuê theo ngày hoặc theo tháng.",
  perMonth: "/ tháng",
  perDay: "Theo ngày",
  deposit: "Cọc",
  suggested: "Hợp với lượng đồ của bạn",
} as const

export const FACILITIES_SECTION = {
  title: "7 cơ sở, 4 thành phố",
  lead: "Chọn thành phố để xem cơ sở gần bạn.",
  climateBadge: "Kho mát",
} as const

export const PROCESS_SECTION = {
  title: "Thuê kho trong 4 bước",
  steps: [
    {
      title: "Chọn cỡ và cơ sở",
      body: "Xem sơ đồ kho, chọn ô còn trống ở cơ sở gần bạn.",
    },
    {
      title: "Đặt và thanh toán online",
      body: "Điền thông tin, xác minh số điện thoại, đặt cọc giữ chỗ.",
    },
    {
      title: "Nhận mã PIN",
      body: "Mã PIN mở cửa được gửi cho bạn ngay khi hợp đồng có hiệu lực.",
    },
    {
      title: "Ra vào 24/7",
      body: "Tự mang đồ đến và lấy đồ bất cứ lúc nào, kể cả ngày lễ.",
    },
  ],
} as const

export interface Testimonial {
  quote: string
  name: string
  context: string
}

export const TESTIMONIALS_SECTION = {
  title: "Khách thuê nói gì",
  /** true = đánh giá minh họa (chưa có dữ liệu thật). Đổi thành false khi thay bằng đánh giá thật. */
  illustrative: true,
  illustrativeNote: "Đánh giá minh họa",
  items: [
    {
      quote:
        "Sửa nhà ba tháng, tôi gửi hết sofa với tủ sách. Lấy về vẫn sạch, không có mùi ẩm.",
      name: "Anh Q.",
      context: "Thuê phòng lớn, Quận 7",
    },
    {
      quote:
        "Hè về quê, gửi đồ phòng trọ ở đây rẻ hơn giữ phòng. Tháng 9 lên lấy lại là xong.",
      name: "Bạn T.",
      context: "Thuê phòng vừa, Cầu Giấy",
    },
    {
      quote:
        "Mấy chiếc túi da với máy ảnh tôi để ở kho mát. Đi công tác dài ngày cũng yên tâm.",
      name: "Chị G.",
      context: "Thuê kho mát, Quận 1",
    },
  ] satisfies Testimonial[],
} as const

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export const FAQ_SECTION = {
  title: "Câu hỏi thường gặp",
  items: [
    {
      id: "access",
      question: "Tôi có ra vào kho lúc nào cũng được không?",
      answer:
        "Được. Cửa kho mở bằng mã PIN 24/7, kể cả ban đêm và ngày lễ. Mã PIN chỉ dùng được khi hợp đồng còn hiệu lực.",
    },
    {
      id: "climate",
      question: "Đồ có bị ẩm mốc không? Kho mát có ở đâu?",
      answer:
        "Kho tiêu chuẩn thoáng khí, hợp đồ gia dụng và đồ chuyển nhà. Kho mát giữ 22–25°C suốt ngày đêm, hiện có tại cơ sở Quận 1, hợp đồ điện tử, đồ da và tài liệu quan trọng.",
    },
    {
      id: "duration",
      question: "Thuê ngắn nhất bao lâu?",
      answer:
        "Tối thiểu 7 ngày. Từ 7 đến 29 ngày tính theo giá ngày. Từ 1 tháng trở lên có gói tháng; gói 3, 6, 12 tháng giảm 5%, 10%, 15%.",
    },
    {
      id: "banned",
      question: "Có đồ nào không được gửi?",
      answer:
        "Không nhận thực phẩm tươi sống hoặc đông lạnh, động vật sống, chất dễ cháy nổ, hóa chất độc hại, vũ khí và hàng cấm theo quy định. Khi đặt kho bạn sẽ xác nhận cam kết này.",
    },
    {
      id: "booking",
      question: "Đặt kho như thế nào?",
      answer:
        "Chọn ô kho trên sơ đồ, tạo tài khoản bằng số điện thoại, xác minh bằng mã OTP rồi đặt cọc online. Mọi bước làm trên web, không cần đến quầy.",
    },
  ] satisfies FaqItem[],
} as const

export const FINAL_CTA = {
  title: "Dọn nhà gọn hơn, bắt đầu từ hôm nay",
  lead: "Chọn ô kho trống ở cơ sở gần bạn, hoặc gọi để được tư vấn cỡ kho.",
} as const

export const FOOTER = {
  tagline: "Kho tự quản thông minh, ra vào 24/7.",
  hotlineLabel: "Hotline",
  copyright: "© 2026 Smart Self Storage",
} as const
