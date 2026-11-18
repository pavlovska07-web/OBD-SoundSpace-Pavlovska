import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Plus,
  Layers,
  Users,
  Hourglass,
  Check,
  X,
  Search,
  Pencil,
  Trash2,
  ClipboardCheck,
} from 'lucide-react';
import { apiFetch } from '../api';
import {
  Band,
  BookingItem,
  ConditionRecord,
  Equipment,
  EquipmentStat,
  Room,
  RoomStat,
  User,
} from '../types';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [tab, setTab] = useState<'analytics' | 'bookings' | 'resources' | 'maintenance'>('bookings');

  const [roomsStats, setRoomsStats] = useState<RoomStat[]>([]);
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStat[]>([]);
  const [damagedEquipment, setDamagedEquipment] = useState<ConditionRecord[]>([]);
  const [futureBookings, setFutureBookings] = useState<BookingItem[]>([]);
  const [allBookings, setAllBookings] = useState<BookingItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [conditions, setConditions] = useState<ConditionRecord[]>([]);
  const [bands, setBands] = useState<Band[]>([]);

  // Пошук і фільтрація у журналі бронювань
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [bookingRoomFilter, setBookingRoomFilter] = useState('ALL');

  // Модальне вікно завершення репетиції
  const [completingBooking, setCompletingBooking] = useState<BookingItem | null>(null);
  const [txPayment, setTxPayment] = useState('Картка');
  const [txCondition, setTxCondition] = useState('Справне');
  const [txNotes, setTxNotes] = useState('Обладнання перевірено після репетиції, зауважень немає.');
  const [txStatus, setTxStatus] = useState<string>('');

  // Форми додавання кімнати та обладнання
  const [newRoom, setNewRoom] = useState({ room_name: '', area_sqm: '30', capacity: '6', hourly_rate: '400', description: '' });
  const [newEq, setNewEq] = useState({ equipment_name: '', category: 'Гітарне підсилення', rental_price: '120', inventory_number: 'INV-EQ-011' });

  // Модальні вікна редагування кімнати та обладнання
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);

  // Форма прямого технічного огляду обладнання
  const [inspectEqId, setInspectEqId] = useState<number>(1);
  const [inspectStatus, setInspectStatus] = useState('Справне');
  const [inspectNotes, setInspectNotes] = useState('');

  const loadAll = async () => {
    try {
      const [analytics, bList, rList, eList, cList, bandsList] = await Promise.all([
        apiFetch<{
          roomsStats: RoomStat[];
          equipmentStats: EquipmentStat[];
          damagedEquipment: ConditionRecord[];
          futureBookings: BookingItem[];
        }>('/admin/analytics'),
        apiFetch<BookingItem[]>('/admin/bookings'),
        apiFetch<Room[]>('/public/rooms'),
        apiFetch<Equipment[]>('/public/equipment'),
        apiFetch<ConditionRecord[]>('/admin/conditions'),
        apiFetch<Band[]>('/admin/bands'),
      ]);

      setRoomsStats(analytics.roomsStats);
      setEquipmentStats(analytics.equipmentStats);
      setDamagedEquipment(analytics.damagedEquipment);
      setFutureBookings(analytics.futureBookings);
      setAllBookings(bList);
      setRooms(rList);
      setEquipment(eList);
      setConditions(cList);
      setBands(bandsList);
      if (eList.length > 0 && !eList.some((item) => item.equipment_id === inspectEqId)) {
        setInspectEqId(eList[0].equipment_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showToast = (msg: string) => {
    setTxStatus(msg);
    setTimeout(() => setTxStatus(''), 4500);
  };

  const handleApproveBooking = async (bookingId: number) => {
    try {
      const res = await apiFetch<{ message: string }>(`/admin/bookings/${bookingId}/approve`, {
        method: 'POST',
      });
      showToast(res.message);
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectBooking = async (bookingId: number) => {
    try {
      const res = await apiFetch<{ message: string }>(`/admin/bookings/${bookingId}/reject`, {
        method: 'POST',
      });
      showToast(res.message);
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingBooking) return;
    try {
      const res = await apiFetch<{ message: string }>(
        `/admin/bookings/${completingBooking.booking_id}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({
            payment_method: txPayment,
            condition_status: txCondition,
            notes: txNotes,
          }),
        }
      );
      showToast(res.message);
      setCompletingBooking(null);
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // CRUD кімнат
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/rooms', {
        method: 'POST',
        body: JSON.stringify({
          ...newRoom,
          area_sqm: Number(newRoom.area_sqm),
          capacity: Number(newRoom.capacity),
          hourly_rate: Number(newRoom.hourly_rate),
        }),
      });
      setNewRoom({ room_name: '', area_sqm: '30', capacity: '6', hourly_rate: '400', description: '' });
      showToast('Нову репетиційну кімнату додано!');
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveRoomEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      await apiFetch(`/admin/rooms/${editingRoom.room_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          room_name: editingRoom.room_name,
          area_sqm: Number(editingRoom.area_sqm),
          capacity: Number(editingRoom.capacity),
          hourly_rate: Number(editingRoom.hourly_rate),
          description: editingRoom.description,
        }),
      });
      setEditingRoom(null);
      showToast('Параметри кімнати оновлено!');
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!window.confirm(`Видалити кімнату «${room.room_name}»? Пов'язані з нею бронювання також будуть видалені.`)) return;
    try {
      await apiFetch(`/admin/rooms/${room.room_id}`, { method: 'DELETE' });
      showToast(`Кімнату «${room.room_name}» видалено.`);
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // CRUD обладнання
  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/equipment', {
        method: 'POST',
        body: JSON.stringify({
          ...newEq,
          rental_price: Number(newEq.rental_price),
        }),
      });
      setNewEq({ equipment_name: '', category: 'Гітарне підсилення', rental_price: '120', inventory_number: 'INV-EQ-012' });
      showToast('Нову одиницю обладнання додано!');
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveEquipmentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEq) return;
    try {
      await apiFetch(`/admin/equipment/${editingEq.equipment_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          equipment_name: editingEq.equipment_name,
          category: editingEq.category,
          rental_price: Number(editingEq.rental_price),
          inventory_number: editingEq.inventory_number,
        }),
      });
      setEditingEq(null);
      showToast('Дані обладнання оновлено!');
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteEquipment = async (eq: Equipment) => {
    if (!window.confirm(`Видалити обладнання «${eq.equipment_name}»?`)) return;
    try {
      await apiFetch(`/admin/equipment/${eq.equipment_id}`, { method: 'DELETE' });
      showToast(`Обладнання «${eq.equipment_name}» видалено.`);
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Прямий техогляд обладнання
  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/conditions', {
        method: 'POST',
        body: JSON.stringify({
          equipment_id: Number(inspectEqId),
          condition_status: inspectStatus,
          notes: inspectNotes,
        }),
      });
      setInspectNotes('');
      showToast('Запис технічного огляду збережено!');
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const pendingBookings = allBookings.filter((b) => b.booking_status === 'Очікує підтвердження');
  const totalRevenue = roomsStats.reduce((s, r) => s + Number(r.total_revenue), 0);
  const maxRoomRevenue = Math.max(1, ...roomsStats.map((r) => Number(r.total_revenue)));

  const filteredBookings = allBookings.filter((b) => {
    const q = bookingSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (b.band_name || '').toLowerCase().includes(q) ||
      (b.contact_person || '').toLowerCase().includes(q) ||
      String(b.booking_id).includes(q);
    const matchesStatus =
      bookingStatusFilter === 'ALL' || b.booking_status === bookingStatusFilter;
    const matchesRoom =
      bookingRoomFilter === 'ALL' || b.room_name === bookingRoomFilter;
    return matchesSearch && matchesStatus && matchesRoom;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Шапка адмін-панелі */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Панель адміністратора студії
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-0.5">
            Керування системою SoundSpace ({user.full_name})
          </h1>
        </div>

        {/* Навігація по вкладках */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'bookings', label: 'Бронювання', icon: CalendarClock, badge: pendingBookings.length },
            { id: 'analytics', label: 'Аналітика', icon: BarChart3, badge: 0 },
            { id: 'resources', label: 'Кімнати та апаратура', icon: Layers, badge: 0 },
            { id: 'maintenance', label: 'Техогляд та гурти', icon: Wrench, badge: damagedEquipment.length },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  tab === t.id
                    ? 'neon-gradient-btn text-white shadow-lg'
                    : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
                {t.badge > 0 && (
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      t.id === 'bookings' ? 'bg-amber-400 text-black' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {txStatus && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 backdrop-blur-md px-5 py-3.5 text-sm font-medium text-emerald-200">
          {txStatus}
        </div>
      )}

      {/* ВКЛАДКА 1: БРОНЮВАННЯ, ФІЛЬТРИ ТА РОЗГЛЯД НОВИХ ЗАЯВОК */}
      {tab === 'bookings' && (
        <div className="space-y-6">
          {pendingBookings.length > 0 && (
            <div className="glass-panel rounded-3xl border border-amber-500/40 p-6 space-y-4">
              <div>
                <h2 className="text-lg font-extrabold text-amber-300 flex items-center gap-2">
                  <Hourglass className="h-5 w-5" /> Нові заявки, що очікують підтвердження ({pendingBookings.length})
                </h2>
                <p className="text-xs text-slate-300/80 mt-0.5">
                  Перевірте параметри замовлення гурту та підтвердіть або відхиліть бронювання
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {pendingBookings.map((pb) => (
                  <div
                    key={pb.booking_id}
                    className="rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md p-4 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-white">
                          Заявка #{pb.booking_id} • {pb.band_name}
                        </span>
                        <span className="shrink-0 rounded-lg bg-pink-500/20 px-2.5 py-1 font-bold text-pink-200">
                          {pb.room_name}
                        </span>
                      </div>
                      <div className="text-slate-200">
                        Контакт: <b>{pb.contact_person}</b> ({pb.band_phone})
                      </div>
                      <div className="text-cyan-300 font-semibold">
                        Дата та час: {pb.booking_date} ({pb.time_slot})
                      </div>
                      <div className="text-slate-200">
                        Обладнання: {pb.equipment_name}
                      </div>
                      <div className="text-white font-bold pt-1">
                        Сума до сплати: {pb.total_cost} ₴ ({pb.payment_method})
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2 border-t border-white/10">
                      <button
                        onClick={() => handleApproveBooking(pb.booking_id)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/25 border border-emerald-500/40 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/40 transition"
                      >
                        <Check className="h-4 w-4" /> Підтвердити
                      </button>
                      <button
                        onClick={() => handleRejectBooking(pb.booking_id)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/35 transition"
                      >
                        <X className="h-4 w-4" /> Відхилити
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Загальний журнал усіх бронювань із пошуком і фільтрами */}
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Журнал усіх бронювань ({filteredBookings.length})
                </h2>
                <p className="text-xs text-slate-300/80">
                  Пошук за гуртом, фільтрація за статусом і залом та закриття репетицій
                </p>
              </div>

              {/* Панель пошуку та фільтрів */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Гурт або № заявки..."
                    className="rounded-xl border border-white/15 bg-white/5 pl-8 pr-3 py-2 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="rounded-xl border border-white/15 bg-[#12121f] px-3 py-2 text-white focus:border-pink-400 focus:outline-none"
                >
                  <option value="ALL">Усі статуси</option>
                  <option value="Очікує підтвердження">Очікує підтвердження</option>
                  <option value="Підтверджено">Підтверджено</option>
                  <option value="Завершено">Завершено</option>
                  <option value="Відхилено">Відхилено</option>
                  <option value="Скасовано">Скасовано</option>
                </select>

                <select
                  value={bookingRoomFilter}
                  onChange={(e) => setBookingRoomFilter(e.target.value)}
                  className="rounded-xl border border-white/15 bg-[#12121f] px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                >
                  <option value="ALL">Усі кімнати</option>
                  {rooms.map((r) => (
                    <option key={r.room_id} value={r.room_name}>
                      {r.room_name}
                    </option>
                  ))}
                </select>

                {(bookingSearch || bookingStatusFilter !== 'ALL' || bookingRoomFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setBookingSearch('');
                      setBookingStatusFilter('ALL');
                      setBookingRoomFilter('ALL');
                    }}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-slate-300 hover:bg-white/15"
                  >
                    Скинути
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-slate-300 uppercase">
                  <tr>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Гурт</th>
                    <th className="py-3 px-3">Кімната</th>
                    <th className="py-3 px-3">Обладнання</th>
                    <th className="py-3 px-3">Дата і час</th>
                    <th className="py-3 px-3">Оплата</th>
                    <th className="py-3 px-3">Статус</th>
                    <th className="py-3 px-3">Дія</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        За обраними фільтрами бронювань не знайдено.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.booking_id} className="hover:bg-white/5">
                        <td className="py-3 px-3 font-bold whitespace-nowrap">#{b.booking_id}</td>
                        <td className="py-3 px-3 font-bold text-white whitespace-nowrap">{b.band_name}</td>
                        <td className="py-3 px-3 text-pink-300 font-semibold whitespace-nowrap">{b.room_name}</td>
                        <td className="py-3 px-3 text-slate-200 max-w-xs">{b.equipment_name}</td>
                        <td className="py-3 px-3 text-cyan-300 whitespace-nowrap">
                          {b.booking_date} ({b.time_slot})
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-bold text-white">{b.total_cost} ₴</span>
                          <div className="text-[11px] text-slate-300/80">{b.payment_method}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 font-semibold ${
                              b.booking_status === 'Завершено'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : b.booking_status === 'Очікує підтвердження'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : b.booking_status === 'Відхилено' || b.booking_status === 'Скасовано'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-purple-500/25 text-purple-200 border border-purple-500/30'
                            }`}
                          >
                            {b.booking_status}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {b.booking_status === 'Очікує підтвердження' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleApproveBooking(b.booking_id)}
                                className="rounded-lg bg-emerald-500/25 px-2.5 py-1.5 font-bold text-emerald-200 hover:bg-emerald-500/40"
                              >
                                Підтвердити
                              </button>
                              <button
                                onClick={() => handleRejectBooking(b.booking_id)}
                                className="rounded-lg bg-rose-500/20 px-2.5 py-1.5 font-bold text-rose-200 hover:bg-rose-500/35"
                              >
                                Відхилити
                              </button>
                            </div>
                          ) : b.booking_status === 'Підтверджено' ? (
                            <button
                              onClick={() => setCompletingBooking(b)}
                              className="neon-gradient-btn inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold text-white"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Завершити
                            </button>
                          ) : (
                            <span className="text-slate-400">Закрито</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ВКЛАДКА 2: АНАЛІТИКА */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card rounded-2xl p-5">
              <div className="text-xs text-slate-300">Загальний дохід студії</div>
              <div className="mt-2 text-3xl font-extrabold neon-text">{totalRevenue} ₴</div>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <div className="text-xs text-slate-300">Очікують підтвердження</div>
              <div className="mt-2 text-3xl font-extrabold text-amber-400">{pendingBookings.length}</div>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <div className="text-xs text-slate-300">Активних майбутніх</div>
              <div className="mt-2 text-3xl font-extrabold text-cyan-400">{futureBookings.length}</div>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <div className="text-xs text-slate-300">Потребує ремонту / огляду</div>
              <div className="mt-2 text-3xl font-extrabold text-rose-400">{damagedEquipment.length}</div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Дохід та кількість бронювань по кімнатах</h2>
              <div className="space-y-3.5">
                {roomsStats.map((r) => (
                  <div key={r.room_id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-white">
                        {r.room_name} <span className="text-slate-300">({r.total_bookings_count} бронювань)</span>
                      </span>
                      <span className="text-pink-400">{r.total_revenue} ₴</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400"
                        style={{ width: `${(Number(r.total_revenue) / maxRoomRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Рейтинг оренди обладнання</h2>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {equipmentStats.map((eq) => (
                  <div
                    key={eq.equipment_id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{eq.equipment_name}</span>
                      <span className="ml-2 text-slate-300">({eq.inventory_number})</span>
                    </div>
                    <span className="rounded-lg bg-cyan-500/20 px-2.5 py-1 font-bold text-cyan-200">
                      {eq.total_rented_count} разів
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-1">Майбутні підтверджені репетиції</h2>
            <p className="text-xs text-slate-300 mb-4">Актуальний графік запланованих сесій студії</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-slate-300 uppercase">
                  <tr>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Гурт</th>
                    <th className="py-3 px-3">Контакт</th>
                    <th className="py-3 px-3">Кімната</th>
                    <th className="py-3 px-3">Дата та час</th>
                    <th className="py-3 px-3">Сума</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {futureBookings.map((fb) => (
                    <tr key={fb.booking_id} className="hover:bg-white/5">
                      <td className="py-3 px-3 font-bold text-slate-200">#{fb.booking_id}</td>
                      <td className="py-3 px-3 font-bold text-white">{fb.band_name}</td>
                      <td className="py-3 px-3 text-slate-200">
                        {fb.contact_person} ({fb.band_phone})
                      </td>
                      <td className="py-3 px-3 text-pink-300 font-semibold">{fb.room_name}</td>
                      <td className="py-3 px-3 text-cyan-300">
                        {fb.booking_date} | {fb.start_time} - {fb.end_time}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">{fb.total_cost} ₴</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ВКЛАДКА 3: КІМНАТИ ТА ОБЛАДНАННЯ (ПОВНИЙ CRUD) */}
      {tab === 'resources' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* КІМНАТИ */}
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Репетиційні кімнати</h2>
            <form onSubmit={handleAddRoom} className="grid grid-cols-2 gap-3 text-xs">
              <input
                required
                placeholder="Назва (напр. Neon Room)"
                value={newRoom.room_name}
                onChange={(e) => setNewRoom({ ...newRoom, room_name: e.target.value })}
                className="col-span-2 rounded-xl border border-white/15 bg-white/5 p-3 text-white"
              />
              <input
                required
                type="number"
                placeholder="Площа м²"
                value={newRoom.area_sqm}
                onChange={(e) => setNewRoom({ ...newRoom, area_sqm: e.target.value })}
                className="rounded-xl border border-white/15 bg-white/5 p-3 text-white"
              />
              <input
                required
                type="number"
                placeholder="Місткість осіб"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                className="rounded-xl border border-white/15 bg-white/5 p-3 text-white"
              />
              <input
                required
                type="number"
                placeholder="Ціна за годину (₴)"
                value={newRoom.hourly_rate}
                onChange={(e) => setNewRoom({ ...newRoom, hourly_rate: e.target.value })}
                className="rounded-xl border border-white/15 bg-white/5 p-3 text-white"
              />
              <button type="submit" className="neon-gradient-btn rounded-xl font-bold text-white flex items-center justify-center gap-1">
                <Plus className="h-4 w-4" /> Додати кімнату
              </button>
              <input
                placeholder="Опис залу (необов'язково)"
                value={newRoom.description}
                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                className="col-span-2 rounded-xl border border-white/15 bg-white/5 p-3 text-white"
              />
            </form>

            <div className="space-y-2 pt-3 border-t border-white/10">
              {rooms.map((r) => (
                <div
                  key={r.room_id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">
                      {r.room_name} <span className="text-slate-400">({r.area_sqm} м², до {r.capacity} осіб)</span>
                    </div>
                    <div className="text-pink-400 font-bold mt-0.5">{r.hourly_rate} ₴/год</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title="Редагувати кімнату"
                      onClick={() => setEditingRoom(r)}
                      className="rounded-lg border border-cyan-500/30 bg-cyan-500/15 p-2 text-cyan-200 hover:bg-cyan-500/30 transition"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Видалити кімнату"
                      onClick={() => handleDeleteRoom(r)}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/15 p-2 text-rose-200 hover:bg-rose-500/30 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ОБЛАДНАННЯ */}
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Музичне обладнання</h2>
            <form onSubmit={handleAddEquipment} className="grid grid-cols-2 gap-3 text-xs">
              <input
                required
                placeholder="Назва обладнання"
                value={newEq.equipment_name}
                onChange={(e) => setNewEq({ ...newEq, equipment_name: e.target.value })}
                className="col-span-2 rounded-xl border border-white/15 bg-white/5 p-3 text-white"
              />
              <input
                required
                placeholder="Категорія"
                value={newEq.category}
                onChange={(e) => setNewEq({ ...newEq, category: e.target.value })}
                className="rounded-xl border border-white/15 bg-white/5 p-3 text-white"
              />
              <input
                required
                placeholder="Інвентарний №"
                value={newEq.inventory_number}
                onChange={(e) => setNewEq({ ...newEq, inventory_number: e.target.value })}
                className="rounded-xl border border-white/15 bg-white/5 p-3 text-white"
              />
              <input
                required
                type="number"
                placeholder="Ціна оренди (₴)"
                value={newEq.rental_price}
                onChange={(e) => setNewEq({ ...newEq, rental_price: e.target.value })}
                className="rounded-xl border border-white/15 bg-white/5 p-3 text-white"
              />
              <button type="submit" className="neon-gradient-btn rounded-xl font-bold text-white flex items-center justify-center gap-1">
                <Plus className="h-4 w-4" /> Додати техніку
              </button>
            </form>

            <div className="space-y-2 pt-3 border-t border-white/10 max-h-80 overflow-y-auto pr-1">
              {equipment.map((eq) => (
                <div
                  key={eq.equipment_id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">
                      {eq.equipment_name} <span className="text-slate-400">[{eq.inventory_number}]</span>
                    </div>
                    <div className="text-cyan-400 font-bold mt-0.5">
                      {eq.category} • {eq.rental_price} ₴
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title="Редагувати обладнання"
                      onClick={() => setEditingEq(eq)}
                      className="rounded-lg border border-cyan-500/30 bg-cyan-500/15 p-2 text-cyan-200 hover:bg-cyan-500/30 transition"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Видалити обладнання"
                      onClick={() => handleDeleteEquipment(eq)}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/15 p-2 text-rose-200 hover:bg-rose-500/30 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ВКЛАДКА 4: ТЕХОГЛЯДИ ТА БАЗА ГУРТІВ */}
      {tab === 'maintenance' && (
        <div className="space-y-6">
          {/* Форма прямого техогляду обладнання */}
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-cyan-400" /> Зафіксувати технічний огляд обладнання
              </h2>
              <p className="text-xs text-slate-300/80 mt-0.5">
                Оновіть технічний стан апаратури після планової перевірки або ремонту
              </p>
            </div>

            <form onSubmit={handleCreateInspection} className="grid gap-3 md:grid-cols-12 text-xs">
              <div className="md:col-span-4">
                <select
                  value={inspectEqId}
                  onChange={(e) => setInspectEqId(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/15 bg-[#12121f] p-3 text-white"
                >
                  {equipment.map((eq) => (
                    <option key={eq.equipment_id} value={eq.equipment_id}>
                      {eq.equipment_name} [{eq.inventory_number}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={inspectStatus}
                  onChange={(e) => setInspectStatus(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#12121f] p-3 text-white"
                >
                  <option value="Справне">Справне</option>
                  <option value="Потребує обслуговування">Потребує обслуговування</option>
                  <option value="Пошкоджено">Пошкоджено</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <input
                  type="text"
                  required
                  value={inspectNotes}
                  onChange={(e) => setInspectNotes(e.target.value)}
                  placeholder="Результат перевірки / ремонту..."
                  className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white"
                />
              </div>

              <button
                type="submit"
                className="md:col-span-2 neon-gradient-btn rounded-xl py-3 font-bold text-white"
              >
                Зберегти акт
              </button>
            </form>
          </div>

          {damagedEquipment.length > 0 && (
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Обладнання із зауваженнями ({damagedEquipment.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {damagedEquipment.map((d, i) => (
                  <div key={i} className="rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md p-4 text-xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2 font-bold text-white">
                      <span>{d.equipment_name} ({d.inventory_number})</span>
                      <span className="shrink-0 text-amber-300">{d.condition_status}</span>
                    </div>
                    <p className="text-slate-200">{d.notes}</p>
                    <div className="text-slate-300">Дата огляду: {d.check_date} • Перевірив: {d.inspector_name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-panel rounded-3xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">Повний журнал технічних перевірок</h2>
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {conditions.map((c) => (
                  <div key={c.condition_id} className="rounded-xl bg-white/5 p-3 text-xs space-y-1">
                    <div className="flex justify-between gap-2 font-bold">
                      <span className="text-white">{c.equipment_name}</span>
                      <span className={`shrink-0 ${c.condition_status === 'Справне' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {c.condition_status}
                      </span>
                    </div>
                    <div className="text-slate-200">{c.notes}</div>
                    <div className="text-[11px] text-slate-400">{c.check_date} • {c.inspector_name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-pink-400" /> Зареєстровані музичні гурти ({bands.length})
              </h2>
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {bands.map((b) => (
                  <div key={b.band_id} className="rounded-xl bg-white/5 p-3 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{b.band_name}</div>
                      <div className="text-slate-300">{b.contact_person} • {b.phone}</div>
                    </div>
                    <span className="rounded-lg bg-pink-500/20 px-2.5 py-1 text-pink-200 font-semibold">
                      {b.genre}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО РЕДАГУВАННЯ КІМНАТИ */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <form onSubmit={handleSaveRoomEdit} className="glass-panel w-full max-w-md rounded-3xl p-6 space-y-4 text-xs">
            <h3 className="text-lg font-extrabold neon-text">Редагування кімнати</h3>
            <div>
              <label className="mb-1 block text-slate-300">Назва залу</label>
              <input
                required
                value={editingRoom.room_name}
                onChange={(e) => setEditingRoom({ ...editingRoom, room_name: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="mb-1 block text-slate-300">Площа (м²)</label>
                <input
                  required
                  type="number"
                  value={editingRoom.area_sqm}
                  onChange={(e) => setEditingRoom({ ...editingRoom, area_sqm: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-slate-300">Осіб</label>
                <input
                  required
                  type="number"
                  value={editingRoom.capacity}
                  onChange={(e) => setEditingRoom({ ...editingRoom, capacity: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-slate-300">₴ / год</label>
                <input
                  required
                  type="number"
                  value={editingRoom.hourly_rate}
                  onChange={(e) => setEditingRoom({ ...editingRoom, hourly_rate: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-sm text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-slate-300">Опис</label>
              <textarea
                rows={3}
                value={editingRoom.description || ''}
                onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-sm text-white"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="flex-1 rounded-xl border border-white/15 py-2.5 font-semibold text-slate-200"
              >
                Скасувати
              </button>
              <button type="submit" className="neon-gradient-btn flex-1 rounded-xl py-2.5 font-bold text-white">
                Зберегти зміни
              </button>
            </div>
          </form>
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО РЕДАГУВАННЯ ОБЛАДНАННЯ */}
      {editingEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <form onSubmit={handleSaveEquipmentEdit} className="glass-panel w-full max-w-md rounded-3xl p-6 space-y-4 text-xs">
            <h3 className="text-lg font-extrabold neon-text">Редагування обладнання</h3>
            <div>
              <label className="mb-1 block text-slate-300">Назва</label>
              <input
                required
                value={editingEq.equipment_name}
                onChange={(e) => setEditingEq({ ...editingEq, equipment_name: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-slate-300">Категорія</label>
              <input
                required
                value={editingEq.category}
                onChange={(e) => setEditingEq({ ...editingEq, category: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-slate-300">Інвентарний №</label>
                <input
                  required
                  value={editingEq.inventory_number}
                  onChange={(e) => setEditingEq({ ...editingEq, inventory_number: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-slate-300">Ціна оренди (₴)</label>
                <input
                  required
                  type="number"
                  value={editingEq.rental_price}
                  onChange={(e) => setEditingEq({ ...editingEq, rental_price: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-sm text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingEq(null)}
                className="flex-1 rounded-xl border border-white/15 py-2.5 font-semibold text-slate-200"
              >
                Скасувати
              </button>
              <button type="submit" className="neon-gradient-btn flex-1 rounded-xl py-2.5 font-bold text-white">
                Зберегти зміни
              </button>
            </div>
          </form>
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО ЗАВЕРШЕННЯ БРОНЮВАННЯ */}
      {completingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <form onSubmit={handleCompleteTransaction} className="glass-panel w-full max-w-md rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold neon-text">
              Завершення бронювання #{completingBooking.booking_id}
            </h3>
            <p className="text-xs text-slate-200">
              Гурт <b>{completingBooking.band_name}</b> • Кімната <b>{completingBooking.room_name}</b> • Сума:{' '}
              <b>{completingBooking.total_cost} ₴</b>
            </p>

            <div>
              <label className="mb-1 block text-xs text-slate-200">Підтвердження оплати</label>
              <select
                value={txPayment}
                onChange={(e) => setTxPayment(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#12121f] p-2.5 text-sm text-white"
              >
                <option value="Картка">Картка</option>
                <option value="Готівка">Готівка</option>
                <option value="Онлайн">Онлайн</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-200">Стан обладнання після репетиції</label>
              <select
                value={txCondition}
                onChange={(e) => setTxCondition(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#12121f] p-2.5 text-sm text-white"
              >
                <option value="Справне">Справне</option>
                <option value="Потребує обслуговування">Потребує обслуговування</option>
                <option value="Пошкоджено">Пошкоджено</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-200">Коментар адміністратора</label>
              <input
                type="text"
                value={txNotes}
                onChange={(e) => setTxNotes(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-sm text-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCompletingBooking(null)}
                className="flex-1 rounded-xl border border-white/15 py-2.5 text-xs font-semibold text-slate-200"
              >
                Скасувати
              </button>
              <button type="submit" className="neon-gradient-btn flex-1 rounded-xl py-2.5 text-xs font-bold text-white">
                Підтвердити та закрити
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};