// ============================================================================
// TYPESCRIPT DEFINITIONS: SMART SELF STORAGE SYSTEM
// Mapped 1:1 with Java Spring Boot Backend DTOs & Entities (Strictly /api/...)
// ============================================================================

// --- 1. US-01 & US-02: Authentication & Account ---
export interface RegisterRequest {
  phone: string;
  fullName: string;
  password: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otpCode: string;
}

export interface ResendOtpRequest {
  phone: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  accountId: number;
  fullName: string;
  phone: string;
  roleId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// --- 2. US-03: Facility, Floors, Units & Pricing ---
export type FacilityStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type UnitStatus = 'AVAILABLE' | 'HOLD' | 'RENTED' | 'MAINTENANCE' | 'OVERDUE';
export type StorageCondition = 'NORMAL' | 'CLIMATE_CONTROLLED';
export type RentalType = 'DAILY' | 'MONTHLY';

export interface Facility {
  facilityId: number;
  facilityCode: string; // HN-01, HN-02, HCM-01, ...
  shortCode: string;    // CG, TX, Q1, Q7, TD, HC, NK
  facilityName: string;
  address: string;
  phone: string;
  floorCount: number;   // 2 hoặc 3
  layoutType: 'A' | 'B'; // 'A' (Urban) hoặc 'B' (Logistics)
  isAllClimate: boolean; // true nếu là HCM-01 (100% kho mát)
  status: FacilityStatus;
}

export interface Floor {
  floorId: number;
  facilityId: number;
  floorName: string;
  maxLoadPerM2?: number;
  status: FacilityStatus;
}

export interface UnitType {
  unitTypeId: number;
  typeName: string; // Size S, Size M, Size L, Size XL
  size: string; // 1m x 1m x 1.2m
  storageCondition: StorageCondition;
  status: string;
}

export interface UnitDetailResponse {
  unitId: string | number;
  unitCode: string; // Mã ô kho: "HN01-G-XL05", "XL05"
  floorId: number;
  floorName?: string;
  unitTypeId: number;
  typeName?: string;
  size?: string;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  areaM2?: number;
  maxLoadKgM2?: number; // Tải trọng tối đa kg/m2
  storageCondition?: StorageCondition;
  isClimate?: boolean; // true nếu là kho mát
  dailyPrice?: number;
  monthlyPrice?: number;
  depositAmount?: number;
  climateSurchargePercent?: number;
  status: UnitStatus;
  holdExpiresAt?: string;
}

export interface CalculatePriceRequest {
  unitTypeId: number;
  rentalType: RentalType;
  duration: number; // >= 7 ngày hoặc >= 1 tháng
}

export interface CalculatePriceResponse {
  success: boolean;
  message: string;
  unitTypeId: number;
  rentalType: RentalType;
  duration: number;
  baseUnitPrice: number;
  baseTotalAmount: number;
  discountPercent: number;
  discountAmount: number;
  climateSurchargeAmount: number;
  finalRentalAmount: number;
  depositAmount: number;
  totalInitialPayment: number;
}

// --- 3. US-05: Deposit, VietQR & Clickwrap Agreement ---
export interface DepositInitiateRequest {
  accountId: number;
  unitCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  rentalType: RentalType;
  agreedClickwrap: boolean; // Bắt buộc true theo BR-18
  ipAddress?: string;
}

export interface DepositInitiateResponse {
  success: boolean;
  message: string;
  reservationId: number;
  reservationCode: string; // RES-CG-8899-K7X2 (BR-15)
  contractId: number;
  contractDraftUrl: string; // /contracts/DRAFT-RES-XXXX.pdf (BR-18)
  paymentId: number;
  invoiceNumber: string; // DEP-CG-20260927-4719 (BR-37)
  depositAmount: number; // 100% tiền cọc (BR-16)
  rentalAmount: number;
  vietQrUrl: string; // Link ảnh VietQR QuickPay
  bankAccount: string;
  bankName: string;
  accountHolder: string;
  transferContent: string;
}

export interface DepositWebhookRequest {
  invoiceNumber: string;
  transactionCode?: string;
  paymentMethod?: string;
  gatewayTransactionId?: string;
}
