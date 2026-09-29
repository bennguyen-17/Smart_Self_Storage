// 7 cơ sở theo BR-00 và docs/Take note.txt.
// Chỉ giữ thông tin public: không đưa bố trí bên trong kho (xem docs) lên trang.

export type CityId = "HN" | "HCM" | "DN" | "CT"

export interface City {
  id: CityId
  label: string
}

export interface PublicFacility {
  code: string
  name: string
  city: CityId
  address: string
  highlights: readonly string[]
  isClimate: boolean
}

export const CITIES: readonly City[] = [
  { id: "HN", label: "Hà Nội" },
  { id: "HCM", label: "TP.HCM" },
  { id: "DN", label: "Đà Nẵng" },
  { id: "CT", label: "Cần Thơ" },
]

export const FACILITIES: readonly PublicFacility[] = [
  {
    code: "HN-01",
    name: "SmartStorage Cầu Giấy",
    city: "HN",
    address: "391 Cầu Giấy, Q. Cầu Giấy, Hà Nội",
    highlights: ["Tòa nhà mặt phố, có sảnh đón khách", "Có tủ S và phòng M, L"],
    isClimate: false,
  },
  {
    code: "HN-02",
    name: "SmartStorage Thanh Xuân",
    city: "HN",
    address: "120 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội",
    highlights: ["Xe tải đỗ sát cửa kho", "Hợp chuyển nhà trọn gói"],
    isClimate: false,
  },
  {
    code: "HCM-01",
    name: "SmartStorage Quận 1",
    city: "HCM",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    highlights: [
      "Toàn bộ là kho mát 22–25°C",
      "Hợp đồ da, rượu vang, thiết bị điện tử, tài liệu",
    ],
    isClimate: true,
  },
  {
    code: "HCM-02",
    name: "SmartStorage Quận 7",
    city: "HCM",
    address: "456 Nguyễn Thị Thập, Quận 7, TP.HCM",
    highlights: ["Mặt sàn rộng, xe tải ra vào dễ", "Hợp hàng bán online"],
    isClimate: false,
  },
  {
    code: "HCM-03",
    name: "SmartStorage Thủ Đức",
    city: "HCM",
    address: "789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM",
    highlights: ["Nhiều phòng lớn cho startup", "Gần khu công nghệ cao"],
    isClimate: false,
  },
  {
    code: "DN-01",
    name: "SmartStorage Hải Châu",
    city: "DN",
    address: "68 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng",
    highlights: [
      "Hợp nội thất homestay, nệm, đồ cồng kềnh",
      "Tủ S cho vali du lịch, túi golf",
    ],
    isClimate: false,
  },
  {
    code: "CT-01",
    name: "SmartStorage Ninh Kiều",
    city: "CT",
    address: "12 Đại lộ Hòa Bình, Q. Ninh Kiều, Cần Thơ",
    highlights: [
      "Tủ cá nhân cho sinh viên, tiểu thương",
      "Phòng lớn cho hàng thương mại",
    ],
    isClimate: false,
  },
]
