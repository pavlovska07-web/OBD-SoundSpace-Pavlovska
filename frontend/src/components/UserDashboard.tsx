import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  PlusCircle,
  Music2,
  CreditCard,
  Hourglass,
  CheckCircle2,
  XCircle,
  Ban,
  Info,
} from 'lucide-react';
import { apiFetch } from '../api';
import { Band, BookingItem, Equipment, Room, User, BookingPrefill } from '../types';

interface UserDashboardProps {
  user: User;
  prefill?: BookingPrefill | null;
}

interface OccupiedSlot {
  booking_id: number;
  start_time: string;
  end_time: string;
  status: string;
}

const MAX_EQUIPMENT_QTY = 4;

export const UserDashboard: React.FC<UserDashboardProps> = ({ user, prefill }) => {
  const [band, setBand] = useState<Band | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  // Поля форми нового бронювання
  const [roomId, setRoomId] = useState<number>(prefill?.roomId || 1);
  const [bookingDate, setBookingDate] = useState(prefill?.date || '2026-11-28');
  const [startTime, setStartTime] = useState(prefill?.startTime || '14:00');
  const [endTime, setEndTime] = useState(prefill?.endTime || '16:00');
  const [selectedEq, setSelectedEq] = useState<Record<number, number>>({});
  const [paymentMethod, setPaymentMethod] = useState('Онлайн');
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Зайняті слоти на вибрану кімнату та дату
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!prefill) return;
    if (prefill.roomId) setRoomId(prefill.roomId);
    if (prefill.date) setBookingDate(prefill.date);
    if (prefill.startTime) setStartTime(prefill.startTime);
    if (prefill.endTime) setEndTime(prefill.endTime);
  }, [prefill]);

  const loadData = async () => {
    try {
      const [bData, myBookings, rData, eData] = await Promise.all([
        apiFetch<Band | null>('/user/band'),
        apiFetch<BookingItem[]>('/user/bookings'),
        apiFetch<Room[]>('/public/rooms'),
        apiFetch<Equipment[]>('/public/equipment'),
      ]);
      setBand(bData);
      setBookings(myBookings);
      setRooms(rData);
      setEquipment(eData);
      if (rData.length > 0 && !prefill?.roomId && !roomId) {
        setRoomId(rData[0].room_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadOccupiedSlots = async (targetRoomId: number, targetDate: string) => {
    if (!targetRoomId || !targetDate) return;
    setLoadingSlots(true);
    try {
      const slots = await apiFetch<OccupiedSlot[]>(
        `/public/room-schedule?room_id=${targetRoomId}&date=${targetDate}`
      );
      setOccupiedSlots(slots);
    } catch {
      setOccupiedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadOccupiedSlots(roomId, bookingDate);
  }, [roomId, bookingDate]);

  const hasTimeOverlap = occupiedSlots.some(
    (slot) => startTime < slot.end_time && endTime > slot.start_time
  );

  const isTimeInvalid =
    startTime >= endTime || startTime < '09:00' || endTime > '22:00' || hasTimeOverlap;

  const calculateEstimatedCost = () => {
    const room = rooms.find((r) => r.room_id === Number(roomId));
    if (!room || startTime >= endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
    let sum = Number(room.hourly_rate) * hours;

    for (const eq of equipment) {
      const qty = selectedEq[eq.equipment_id] || 0;
      sum += Number(eq.rental_price) * qty;
    }
    return Math.round(sum * 100) / 100;
  };

  const toggleEquipment = (id: number, delta: number) => {
    setSelectedEq((prev) => {
      const current = prev[id] || 0;
      const next = Math.min(MAX_EQUIPMENT_QTY, Math.max(0, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    if (newStart >= endTime) {
      const [h, m] = newStart.split(':').map(Number);
      const nextH = Math.min(22, h + 1);
      setEndTime(`${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (startTime >= endTime) {
      setMessage({ type: 'err', text: 'Час завершення оренди не може бути раніше або дорівнювати часу початку.' });
      return;
    }
    if (startTime < '09:00' || endTime > '22:00') {
      setMessage({ type: 'err', text: 'Студія працює з 09:00 до 22:00. Оберіть час у межах робочого графіка.' });
      return;
    }
    if (hasTimeOverlap) {
      setMessage({ type: 'err', text: 'Обраний інтервал перетинається із уже зайнятим часом цієї кімнати.' });
      return;
    }

    setSubmitting(true);
    try {
      const equipment_items = Object.entries(selectedEq)
        .filter(([, qty]) => qty > 0)
        .map(([equipment_id, quantity]) => ({
          equipment_id: Number(equipment_id),
          quantity,
        }));

      const res = await apiFetch<{ message: string; total_cost: number }>('/user/bookings', {
        method: 'POST',
        body: JSON.stringify({
          room_id: Number(roomId),
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          equipment_items,
          payment_method: paymentMethod === 'Пізніше' ? null : paymentMethod,
        }),
      });

      setMessage({ type: 'ok', text: `${res.message} Розрахункова сума: ${res.total_cost} ₴` });
      setSelectedEq({});
      await Promise.all([loadData(), loadOccupiedSlots(roomId, bookingDate)]);
    } catch (err: any) {
      setMessage({ type: 'err', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm(`Скасувати бронювання №${bookingId}?`)) return;
    setCancellingId(bookingId);
    setMessage(null);
    try {
      const res = await apiFetch<{ message: string }>(`/user/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });
      setMessage({ type: 'ok', text: res.message });
      await Promise.all([loadData(), loadOccupiedSlots(roomId, bookingDate)]);
    } catch (err: any) {
      setMessage({ type: 'err', text: err.message });
    } finally {
      setCancellingId(null);
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'Очікує підтвердження':
        return (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/35 px-2.5 py-0.5 text-[11px] font-semibold">
            <Hourglass className="h-3 w-3" /> Очікує підтвердження
          </span>
        );
      case 'Підтверджено':
        return (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 px-2.5 py-0.5 text-[11px] font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Підтверджено
          </span>
        );
      case 'Завершено':
        return (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 px-2.5 py-0.5 text-[11px] font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Завершено
          </span>
        );
      case 'Відхилено':
      case 'Скасовано':
        return (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/35 px-2.5 py-0.5 text-[11px] font-semibold">
            <XCircle className="h-3 w-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="whitespace-nowrap rounded-full bg-white/10 text-slate-300 px-2.5 py-0.5 text-[11px] font-semibold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Шапка профілю гурту */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg">
            <Music2 className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-pink-400">Кабінет музиканта</div>
            <h1 className="text-2xl font-extrabold text-white">
              {band ? band.band_name : user.full_name}
            </h1>
            <p className="text-sm text-slate-300/80">
              {band ? `Жанр: ${band.genre} • Контакт: ${band.contact_person} (${band.phone})` : user.email}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center">
            <div className="text-xl font-extrabold text-cyan-400">{bookings.length}</div>
            <div className="text-xs text-slate-300/80">Усього заявок</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center">
            <div className="text-xl font-extrabold text-pink-400">
              {bookings
                .filter((b) => b.status === 'Підтверджено' || b.status === 'Завершено')
                .reduce((acc, b) => acc + Number(b.total_cost || 0), 0)}{' '}
              ₴
            </div>
            <div className="text-xs text-slate-300/80">Підтверджено на суму</div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* ФОРМА НОВОГО БРОНЮВАННЯ */}
        <div className="lg:col-span-5">
          <form onSubmit={handleCreateBooking} className="glass-panel rounded-3xl p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-pink-400" /> Нове бронювання репетиції
              </h2>
              <p className="mt-1 text-xs text-slate-300/80">
                Графік роботи студії: <span className="text-cyan-300 font-semibold">09:00 – 22:00</span>
              </p>
            </div>

            {message && (
              <div
                className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${
                  message.type === 'ok'
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                    : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-200">Репетиційна кімната</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(Number(e.target.value))}
                className="w-full rounded-xl border border-white/15 bg-[#12121f] px-3.5 py-2.5 text-sm text-white focus:border-pink-400 focus:outline-none"
              >
                {rooms.map((r) => (
                  <option key={r.room_id} value={r.room_id}>
                    {r.room_name} — {r.hourly_rate} ₴/год (до {r.capacity} осіб)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="mb-1 block text-xs text-slate-200">Дата</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-200">Початок</label>
                <input
                  type="time"
                  required
                  min="09:00"
                  max="21:00"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-200">Завершення</label>
                <input
                  type="time"
                  required
                  min="10:00"
                  max="22:00"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Блок зайнятих слотів на вибрану дату */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1.5">
                <Info className="h-3.5 w-3.5 text-cyan-400" />
                Зайняті години на {bookingDate}:
              </div>
              {loadingSlots ? (
                <span className="text-slate-400">Оновлення розкладу...</span>
              ) : occupiedSlots.length === 0 ? (
                <span className="text-emerald-300 font-medium">
                  Кімната повністю вільна з 09:00 до 22:00
                </span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {occupiedSlots.map((slot) => (
                    <span
                      key={slot.booking_id}
                      className="rounded-lg border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200"
                    >
                      {slot.start_time} – {slot.end_time}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isTimeInvalid && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2 text-xs text-rose-200">
                {startTime >= endTime
                  ? 'Час завершення має бути пізнішим за час початку репетиції.'
                  : startTime < '09:00' || endTime > '22:00'
                  ? 'Оберіть час у межах роботи студії (з 09:00 до 22:00).'
                  : 'Обраний інтервал перетинається із зайнятим часом кімнати.'}
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-200">Додаткове обладнання</label>
                <span className="text-[11px] text-slate-400">макс. {MAX_EQUIPMENT_QTY} шт. кожного</span>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {equipment.map((eq) => {
                  const qty = selectedEq[eq.equipment_id] || 0;
                  return (
                    <div
                      key={eq.equipment_id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{eq.equipment_name}</div>
                        <div className="text-[11px] text-slate-400">+{eq.rental_price} ₴ / сесія</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={qty <= 0}
                          onClick={() => toggleEquipment(eq.equipment_id, -1)}
                          className="h-7 w-7 rounded-lg bg-white/10 text-sm font-bold hover:bg-white/20 disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-cyan-300">{qty}</span>
                        <button
                          type="button"
                          disabled={qty >= MAX_EQUIPMENT_QTY}
                          onClick={() => toggleEquipment(eq.equipment_id, 1)}
                          className="h-7 w-7 rounded-lg bg-pink-500/30 text-sm font-bold text-pink-200 hover:bg-pink-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-200">Спосіб оплати</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#12121f] px-3.5 py-2.5 text-sm text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="Онлайн">Онлайн-оплата після підтвердження</option>
                <option value="Картка">Карткою на студії</option>
                <option value="Готівка">Готівкою на студії</option>
                <option value="Пізніше">Оплатити після репетиції</option>
              </select>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
              <span className="text-xs font-medium text-slate-200">Розрахована вартість:</span>
              <span className="text-xl font-extrabold neon-text">{calculateEstimatedCost()} ₴</span>
            </div>

            <button
              type="submit"
              disabled={submitting || isTimeInvalid}
              className="neon-gradient-btn w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Надсилання заявки...' : 'Надіслати заявку на бронювання'}
            </button>
          </form>
        </div>

        {/* СПИСОК БРОНЮВАНЬ КОРИСТУВАЧА */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Мої репетиції та статус заявок</h2>

            {bookings.length === 0 ? (
              <p className="text-sm text-slate-300/80 py-8 text-center">
                У вашого гурту ще немає бронювань. Створіть перше у формі ліворуч!
              </p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => {
                  const canCancel =
                    b.status === 'Очікує підтвердження' || b.status === 'Підтверджено';
                  return (
                    <div
                      key={b.booking_id}
                      className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-bold text-white text-base">{b.room_name}</span>
                          {renderStatusBadge(b.status)}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-pink-400" /> {b.booking_date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-cyan-400" /> {b.start_time} – {b.end_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3.5 w-3.5 text-purple-400" /> {b.payment_method}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300/80">
                          Обладнання: <span className="text-slate-100">{b.equipment_list}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-lg font-extrabold text-white">{b.total_cost} ₴</div>
                          <div className="text-[11px] text-slate-400">Заявка №{b.booking_id}</div>
                        </div>

                        {canCancel && (
                          <button
                            type="button"
                            disabled={cancellingId === b.booking_id}
                            onClick={() => handleCancelBooking(b.booking_id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-500/35 bg-rose-500/15 px-3 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-500/30 transition disabled:opacity-50"
                          >
                            <Ban className="h-3 w-3" />
                            {cancellingId === b.booking_id ? 'Скасування...' : 'Скасувати'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};