export enum UserRole {
  CUSTOMER = 'customer',
  PROVIDER = 'provider',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export enum BookingStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  UPI = 'upi',
  CARD = 'card',
  WALLET = 'wallet',
  CASH = 'cash',
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  profile_photo_url?: string;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

export interface Customer {
  id: string;
  user_id: string;
  default_address_id?: string;
  total_bookings: number;
  average_rating: number;
  created_at: Date;
  updated_at: Date;
}

export interface Provider {
  id: string;
  user_id: string;
  bio?: string;
  experience_years: number;
  hourly_rate?: number;
  is_online: boolean;
  is_verified: boolean;
  current_location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  work_radius_meters: number;
  total_jobs: number;
  completed_jobs: number;
  cancelled_jobs: number;
  average_rating: number;
  total_earnings: number;
  created_at: Date;
  updated_at: Date;
}

export interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  provider_id?: string;
  service_id: string;
  address_id?: string;
  service_location: {
    type: 'Point';
    coordinates: [number, number];
  };
  scheduled_at?: Date;
  accepted_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  cancelled_at?: Date;
  status: BookingStatus;
  estimated_price: number;
  final_price?: number;
  platform_fee?: number;
  provider_earnings?: number;
  description?: string;
  special_instructions?: string;
  cancellation_reason?: string;
  customer_rating?: number;
  customer_review?: string;
  provider_rating?: number;
  provider_review?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
    id: string;
    booking_id: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    transaction_id?: string;
    processed_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  duration_minutes: number;
  created_at: Date;
  updated_at: Date;
}

export interface Address {
  id: string;
  user_id: string;
    label?: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    location: {
      type: 'Point';
      coordinates: [number, number];
    };
    created_at: Date;
    updated_at: Date;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceCategoryMapping {
  id: string;
  service_id: string;
  category_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProviderAvailability {
  id: string;
  provider_id: string;
  day_of_week: number; // 0 (Sunday) to 6 (Saturday)
  start_time: string; // "HH:MM" format
  end_time: string;   // "HH:MM" format
  created_at: Date;
  updated_at: Date;
}

export interface ProviderSkill {
  id: string;
  provider_id: string;
  service_id: string;
  proficiency_level?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DiscountCode {
  id: string;
  code: string;
  description?: string;
  discount_percentage: number;
  valid_from: Date;
  valid_until: Date;
  usage_limit?: number;
  times_used: number;
  created_at: Date;
  updated_at: Date;
}
export interface BookingDiscount {
  id: string;
  booking_id: string;
  discount_code_id: string;
  discount_amount: number;
  created_at: Date;
  updated_at: Date;
}
export interface Refund {
  id: string;
  payment_id: string;
  amount: number;
  reason?: string;
  processed_at?: Date;
  created_at: Date;
  updated_at: Date;
}
export interface ServicePackage {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  created_at: Date;
  updated_at: Date;
}
export interface ServicePackageMapping {
  id: string;
  service_id: string;
  package_id: string;
  created_at: Date;
  updated_at: Date;
}
export interface ProviderCertification {
  id: string;
  provider_id: string;
  certification_name: string;
  institution: string;
  issue_date: Date;
  expiry_date?: Date;
  credential_id?: string;
  credential_url?: string;
  created_at: Date;
  updated_at: Date;
}
export interface LoyaltyPoint {
  id: string;
  user_id: string;
  points: number;
  created_at: Date;
  updated_at: Date;
}