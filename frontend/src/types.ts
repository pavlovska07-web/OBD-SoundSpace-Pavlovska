export interface User {
  user_id: number;
  email: string;
  role: 'user' | 'admin';
  band_id: number | null;
  admin_id: number | null;
  full_name: string;
}

export interface Room {
  room_id: number;
  room_name: string;
  area_sqm: number;
  capacity: number;
  hourly_rate: number;
  description: string;
}

export interface Equipment {
  equipment_id: number;
  equipment_name: string;
  category: string;
  rental_price: number;
  inventory_number: string;
}

export interface Band {
  band_id: number;
  band_name: string;
  genre: string;
  contact_person: string;
  phone: string;
}

export interface BookingItem {
  booking_id: number;
  band_name?: string;
  contact_person?: string;
  band_phone?: string;
  room_name: string;
  booking_date: string;
  start_time?: string;
  end_time?: string;
  time_slot?: string;
  status?: string;
  booking_status?: string;
  total_cost: number;
  payment_method?: string;
  equipment_list?: string;
  equipment_name?: string;
}

export interface RoomStat {
  room_id: number;
  room_name: string;
  total_bookings_count: number;
  total_revenue: number;
}

export interface EquipmentStat {
  equipment_id: number;
  equipment_name: string;
  inventory_number: string;
  total_rented_count: number;
}

export interface ConditionRecord {
  condition_id?: number;
  equipment_name: string;
  inventory_number: string;
  condition_status: string;
  notes: string;
  check_date: string;
  inspector_name: string;
}

export interface BookingPrefill {
  roomId?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
}