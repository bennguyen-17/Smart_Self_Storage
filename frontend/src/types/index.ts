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

export type FacilityStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type UnitStatus = 'AVAILABLE' | 'HOLD' | 'RENTED' | 'MAINTENANCE' | 'OVERDUE';
export type StorageCondition = 'NORMAL' | 'CLIMATE_CONTROLLED';
export type RentalType = 'DAILY' | 'MONTHLY';

export interface Facility {
  facilityId: number;
  facilityCode: string; // vd: HN01, HCM01
  shortCode: string;    // vd: CG, TX, Q1
  facilityName: string;
  address: string;
  phone: string;
  floorCount: number;
  layoutType: 'A' | 'B'; // A: Urban, B: Logistics
  isAllClimate: boolean; // true với cơ sở 100% kho mát
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
  typeName: string;
  size: string;
  storageCondition: StorageCondition;
  status: string;
}

export interface UnitDetailResponse {
  unitId: string | number;
  unitCode: string; // vd: HN01-G-XL05
  floorId: number;
  floorName?: string;
  unitTypeId: number;
  typeName?: string;
  size?: string;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  areaM2?: number;
  maxLoadKgM2?: number;
  storageCondition?: StorageCondition;
  isClimate?: boolean;
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

export interface DepositInitiateRequest {
  accountId: number;
  unitCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  rentalType: RentalType;
  agreedClickwrap: boolean;
  ipAddress?: string;
}

export interface DepositInitiateResponse {
  success: boolean;
  message: string;
  reservationId: number;
  reservationCode: string;
  contractId: number;
  contractDraftUrl: string;
  paymentId: number;
  invoiceNumber: string;
  depositAmount: number;
  rentalAmount: number;
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
