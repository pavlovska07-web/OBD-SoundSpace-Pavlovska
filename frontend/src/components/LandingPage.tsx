import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Users,
  Maximize2,
  CalendarCheck,
  Mic2,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  MapPin,
  Train,
  Clock,
  Volume2,
  Wifi,
  Coffee,
} from 'lucide-react';
import { apiFetch } from '../api';
import { Room, Equipment, User, BookingPrefill } from '../types';

interface LandingPageProps {
  user: User | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onGoToDashboard: () => void;
  onSelectBooking: (prefill: BookingPrefill) => void;
}

const ROOM_PHOTOS = [
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1000&q=80',
];

interface ExtendedRoomInfo {
  branchName: string;
  address: string;
  metroInfo: string;
  floorAndAccess: string;
  paragraphs: string[];
  includedGear: string[];
}

function getExtendedRoomInfo(room: Room, index: number): ExtendedRoomInfo {
  const nameLower = room.room_name.toLowerCase();

  if (nameLower.includes('red')) {
    return {
      branchName: 'SoundSpace Central (Поділ)',
      address: 'м. Київ, вул. Нижній Вал, 37/20, корпус А, 1 поверх',
      metroInfo: '3 хв пішки від ст. м. «Контрактова площа», заїзд у двір з вул. Костянтинівської',
      floorAndAccess: 'Окремий вхід з двору без сходів, власне паркомісце для апаратури',
      paragraphs: [
        'Studio Red — одна з найпопулярніших локацій комплексу на Подолі, створена для рок-, інді- та поп-колективів, яким важливий щільний, зібраний мікс без зайвого гулу. Стіни та стеля виконані за багатошаровою акустичною технологією з дифузорами Шредера та басовими пастками, тому кожен інструмент читається чітко на високій гучності.',
        'У залі змонтовано портальний звук потужністю 2 кВт, 16-канальний мікшерний пульт із процесором ефектів, гітарні та басовий стеки. Ударна установка стоїть на віброізолюючому подіумі, що прибирає резонанс підлоги та робить гру барабанщика комфортною для всього гурту.',
        'Локація оснащена припливно-витяжною вентиляцією та інверторним клімат-контролем. Поруч із залом розташована затишна лаунж-зона зі свіжомеленою кавою, питною водою та швидкісним Wi-Fi для запису демо.',
      ],
      includedGear: [
        'Портальна акустика JBL PRX (2 кВт) + 2 монітори',
        'Мікшерний пульт Soundcraft Signature 16',
        'Ударна установка Tama Superstar (бочка, 3 томи, 4 стійки)',
        'Гітарний комбопідсилювач + басовий стек 300 Вт',
        '3 вокальні мікрофони зі стійками та комутація',
      ],
    };
  }

  if (nameLower.includes('blue')) {
    return {
      branchName: 'SoundSpace Central (Поділ)',
      address: 'м. Київ, вул. Нижній Вал, 37/20, корпус А, 1 поверх (праве крило)',
      metroInfo: '3 хв пішки від ст. м. «Контрактова площа», зручний вихід до транспорту та кав’ярень',
      floorAndAccess: 'Перший поверх, широкі дверні прорізи для кейсів, цілодобова охорона',
      paragraphs: [
        'Studio Blue — просторий 35-метровий зал на Подолі для повноцінних складів до 7 музикантів, включно з двома гітаристами, клавішником та бек-вокалом. Завдяки геометрії приміщення та комбінації поглинаючих і розсіюючих панелей зал має збалансовану акустику як для репетицій, так і для зйомки Live-відео.',
        'Особливістю локації є розширена комутаційна панель із прямими лініями в апаратну, що дозволяє записати кожен інструмент окремою доріжкою без довгого перепідключення кабелів. Освітлення зали має кілька сценаріїв — від яскравого робочого світла до атмосферної неонової підсвітки.',
        'Для зручності музикантів у кімнаті є м’який диван, стійки під 6 інструментів, підставки для планшетів із текстами та доступ до лаунж-зони комплексу. За запитом адміністратор безкоштовно надасть пюпітри та запасні кабелі.',
      ],
      includedGear: [
        'Лінійний масив QSC K-Series (2.4 кВт) + 3 монітори',
        'Цифровий мікшер Behringer X32 Rack з планшетом',
        'Ударна установка Pearl Export на антивібраційному подіумі',
        '2 гітарні підсилювачі + басовий кабінет Ampeg 4x10',
        'Клавішна стійка, 4 мікрофонні стійки та DI-бокси',
      ],
    };
  }

  const branchVariants = [
    {
      branchName: 'SoundSpace Pro Stage (Печерськ)',
      address: 'м. Київ, вул. Велика Васильківська, 72, корпус Б (цокольний рівень)',
      metroInfo: '4 хв пішки від ст. м. «Олімпійська», зручний заїзд з вул. Великої Васильківської',
      floorAndAccess: 'Окремий вантажний під’їзд прямо до входу студії, паркінг на 6 авто',
    },
    {
      branchName: 'SoundSpace Lab & Acoustic (Лук’янівка)',
      address: 'м. Київ, вул. Січових Стрільців, 52А, 2 поверх',
      metroInfo: '7 хв пішки від ст. м. «Лук’янівська», поруч зупинки транспорту',
      floorAndAccess: 'Вантажний ліфт, система контролю доступу, зона очікування',
    },
  ];
  const branch = branchVariants[index % branchVariants.length];

  return {
    branchName: branch.branchName,
    address: branch.address,
    metroInfo: branch.metroInfo,
    floorAndAccess: branch.floorAndAccess,
    paragraphs: [
      `${room.room_name} — професійний репетиційний простір площею ${room.area_sqm} м², розрахований на комфортну роботу колективу до ${room.capacity} музикантів. ${
        room.description || 'Зал обладнаний сучасною системою звукоізоляції та акустичної корекції.'
      } Архітектура кімнати повністю усуває небажані відбиття та забезпечує прозору читабельність кожного інструмента.`,
      `На цій локації вже встановлено базовий студійний беклайн: потужні портальні системи, мікшерний пульт із зручною маршрутизацією моніторних ліній, ударну установку та інструментальні підсилювачі. За потреби ви можете додати гітари, синтезатори або вокальні системи з парку обладнання SoundSpace.`,
      `Локація має автономну вентиляцію, клімат-контроль, регульоване освітлення та гігабітний Wi-Fi. Для музикантів облаштовано зону відпочинку з кавою та місцем для безпечного розміщення кейсів.`,
    ],
    includedGear: [
      'Професійна портальна акустика та сценічні монітори',
      'Багатоканальний мікшерний пульт із обробкою',
      'Повнорозмірна ударна установка зі стійками',
      'Гітарне та басове підсилення для живого складу',
      'Комплект вокальних мікрофонів, стійок та комутації',
    ],
  };
}

export const LandingPage: React.FC<LandingPageProps> = ({
  user,
  onOpenAuth,
  onGoToDashboard,
  onSelectBooking,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [detailsModalData, setDetailsModalData] = useState<{ room: Room; index: number } | null>(null);

  const [checkDate, setCheckDate] = useState('2026-11-20');
  const [checkStartTime, setCheckStartTime] = useState('14:00');
  const [checkEndTime, setCheckEndTime] = useState('16:00');
  const [availableRooms, setAvailableRooms] = useState<Room[] | null>(null);
  const [checkError, setCheckError] = useState('');
  const [checking, setChecking] = useState(false);

  const eqSectionRef = useRef<HTMLElement | null>(null);
  const eqScrollRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const lastWindowScrollYRef = useRef(0);

  useEffect(() => {
    apiFetch<Room[]>('/public/rooms').then(setRooms).catch(console.error);
    apiFetch<Equipment[]>('/public/equipment').then(setEquipment).catch(console.error);
  }, []);

  // Блокуємо скрол фонової сторінки, коли відкрите модальне вікно «Докладніше»
  useEffect(() => {
    if (detailsModalData) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [detailsModalData]);

  useEffect(() => {
    if (equipment.length > 0 && eqScrollRef.current) {
      eqScrollRef.current.scrollLeft = 110;
    }
  }, [equipment.length]);

  useEffect(() => {
    lastWindowScrollYRef.current = window.scrollY;
    const onPageScroll = () => {
      const currentY = window.scrollY;
      const deltaY = currentY - lastWindowScrollYRef.current;
      lastWindowScrollYRef.current = currentY;

      const container = eqScrollRef.current;
      const section = eqSectionRef.current;
      if (!container || !section) return;

      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        container.scrollLeft += deltaY * 0.45;
      }
    };

    window.addEventListener('scroll', onPageScroll, { passive: true });
    return () => window.removeEventListener('scroll', onPageScroll);
  }, []);

  useEffect(() => {
    if (rooms.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % rooms.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [rooms.length]);

  const handleCheckAvailability = async () => {
    setCheckError('');
    if (!checkDate) {
      setCheckError('Оберіть дату для перевірки.');
      return;
    }
    if (checkStartTime >= checkEndTime) {
      setCheckError('Час завершення має бути пізнішим за час початку.');
      return;
    }
    if (checkStartTime < '09:00' || checkEndTime > '22:00') {
      setCheckError('Студія працює з 09:00 до 22:00. Оберіть час у межах графіка роботи.');
      return;
    }

    setChecking(true);
    try {
      const free = await apiFetch<Room[]>(
        `/public/available-rooms?date=${checkDate}&start_time=${checkStartTime}&end_time=${checkEndTime}`
      );
      setAvailableRooms(free);
    } catch (e: any) {
      setCheckError(e.message || 'Помилка перевірки');
    } finally {
      setChecking(false);
    }
  };

  const handleEquipmentWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = eqScrollRef.current;
    if (!container) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!eqScrollRef.current) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.pageX - eqScrollRef.current.offsetLeft;
    dragStartScrollRef.current = eqScrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !eqScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - eqScrollRef.current.offsetLeft;
    const walk = (x - dragStartXRef.current) * 1.4;
    eqScrollRef.current.scrollLeft = dragStartScrollRef.current - walk;
  };

  const stopDragging = () => {
    isDraggingRef.current = false;
  };

  const scrollEquipmentBy = (offset: number) => {
    eqScrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const extendedInfo = detailsModalData
    ? getExtendedRoomInfo(detailsModalData.room, detailsModalData.index)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 space-y-20">
      {/* HERO БЛОК */}
      <section className="glass-panel relative overflow-hidden rounded-[2rem] p-8 md:p-14">
        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/35 bg-pink-500/15 px-4 py-1.5 text-xs font-semibold text-pink-200 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-pink-300" /> Музичний репетиційний комплекс нового покоління
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              Твій ідеальний звук у <span className="neon-text">SoundSpace Studio</span>
            </h1>

            <p className="max-w-2xl text-base text-slate-200/90 sm:text-lg leading-relaxed">
              Акустично підготовлені репетиційні зали, топове лампове підсилення, ударні установки та
              миттєве онлайн-бронювання без дзвінків. Обирай кімнату, додавай обладнання та керуй розкладом гурту в один клік.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              {user ? (
                <button
                  onClick={onGoToDashboard}
                  className="neon-gradient-btn flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold text-white shadow-xl"
                >
                  Перейти до кабінету ({user.role === 'admin' ? 'Адміністратор' : 'Мій гурт'})
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="neon-gradient-btn flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold text-white shadow-xl"
                  >
                    Зареєструватися та забронювати <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-semibold text-slate-100 hover:bg-white/10 backdrop-blur-md transition"
                  >
                    Увійти в акаунт
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-start gap-8 sm:gap-12 pt-5 border-t border-white/15">
              <div>
                <div className="text-2xl font-extrabold text-white">{rooms.length || 5} залів</div>
                <div className="text-xs text-slate-300/80 mt-0.5">від 18 до 60 м²</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-pink-400">09:00–22:00</div>
                <div className="text-xs text-slate-300/80 mt-0.5">щоденний графік</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-cyan-400">Pro Gear</div>
                <div className="text-xs text-slate-300/80 mt-0.5">Marshall, Tama, Nord</div>
              </div>
            </div>
          </div>

          {/* ДИНАМІЧНА КАРТКА-СЛАЙДЕР ВСІХ КІМНАТ */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-white/15 shadow-2xl h-[390px]">
              {rooms.length > 0 ? (
                rooms.map((room, idx) => (
                  <div
                    key={room.room_id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    <img
                      src={ROOM_PHOTOS[idx % ROOM_PHOTOS.length]}
                      alt={room.room_name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090614]/90 via-transparent to-transparent" />

                    <div className="absolute bottom-4 left-4 right-4 glass-panel rounded-2xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-cyan-300 font-semibold">
                            {room.area_sqm} м² • до {room.capacity} музикантів
                          </div>
                          <div className="text-base font-extrabold text-white mt-0.5">{room.room_name}</div>
                        </div>
                        <button
                          onClick={() => onSelectBooking({ roomId: room.room_id })}
                          className="shrink-0 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition"
                        >
                          {room.hourly_rate} ₴/год
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-center gap-1.5">
                        {rooms.map((r, dotIdx) => (
                          <button
                            key={r.room_id}
                            type="button"
                            aria-label={r.room_name}
                            onClick={() => setActiveSlide(dotIdx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              dotIdx === activeSlide
                                ? 'w-6 bg-gradient-to-r from-pink-400 to-cyan-400'
                                : 'w-1.5 bg-white/30 hover:bg-white/60'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center bg-white/5 text-sm text-slate-300">
                  Завантаження залів...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ШВИДКА ПЕРЕВІРКА ВІЛЬНИХ КІМНАТ НА ДАТУ ТА ЧАС */}
      <section className="glass-panel rounded-3xl p-7 md:p-9 space-y-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <CalendarCheck className="h-6 w-6 text-cyan-400" /> Перевірити вільні кімнати на дату та час
            </h2>
            <p className="mt-1 text-sm text-slate-300/85">
              Графік роботи всіх залів студії: <span className="text-cyan-300 font-semibold">щодня з 09:00 до 22:00</span>
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-300">Дата репетиції</label>
              <input
                type="date"
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white backdrop-blur-md focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-300">Початок (з 09:00)</label>
              <input
                type="time"
                min="09:00"
                max="21:00"
                value={checkStartTime}
                onChange={(e) => {
                  const val = e.target.value;
                  setCheckStartTime(val);
                  if (val >= checkEndTime) {
                    const [h, m] = val.split(':').map(Number);
                    const nextH = Math.min(22, h + 1);
                    setEndTimeHelper(nextH, m);
                  }
                }}
                className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white backdrop-blur-md focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-300">Завершення (до 22:00)</label>
              <input
                type="time"
                min="10:00"
                max="22:00"
                value={checkEndTime}
                onChange={(e) => setCheckEndTime(e.target.value)}
                className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white backdrop-blur-md focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <button
              onClick={handleCheckAvailability}
              disabled={checking}
              className="neon-gradient-btn rounded-xl px-6 py-2.5 text-sm font-bold text-white h-[42px]"
            >
              {checking ? 'Пошук...' : 'Знайти вільні кімнати'}
            </button>
          </div>
        </div>

        {checkError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-xs text-rose-200">
            {checkError}
          </div>
        )}

        {availableRooms && !checkError && (
          <div className="border-t border-white/10 pt-5">
            <div className="mb-3 text-sm font-semibold text-cyan-300">
              Вільні кімнати на {checkDate} ({checkStartTime} – {checkEndTime}) — знайдено {availableRooms.length}:
            </div>
            {availableRooms.length === 0 ? (
              <p className="text-sm text-slate-300">На обраний час усі кімнати вже заброньовані. Спробуйте інші години.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableRooms.map((r) => (
                  <div
                    key={r.room_id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-md p-4"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> {r.room_name}
                      </div>
                      <div className="text-xs text-slate-200/85 mt-1">
                        {r.area_sqm} м² • до {r.capacity} осіб
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-emerald-300">{r.hourly_rate} ₴/год</div>
                      <button
                        onClick={() =>
                          onSelectBooking({
                            roomId: r.room_id,
                            date: checkDate,
                            startTime: checkStartTime,
                            endTime: checkEndTime,
                          })
                        }
                        className="mt-1.5 inline-block rounded-lg bg-pink-500/25 px-3 py-1 text-xs font-bold text-pink-200 hover:bg-pink-500/40 transition"
                      >
                        Забронювати →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* КАТАЛОГ РЕПЕТИЦІЙНИХ КІМНАТ */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Наші репетиційні кімнати</h2>
          <p className="mt-1 text-sm text-slate-300/80">Оберіть простір під масштаб та звучання вашого колективу</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, idx) => (
            <div key={room.room_id} className="glass-card overflow-hidden rounded-3xl flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={ROOM_PHOTOS[idx % ROOM_PHOTOS.length]}
                  alt={room.room_name}
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a1e]/80 via-transparent to-transparent" />
                <span className="absolute left-3 top-3 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 px-2.5 py-1 text-[11px] font-medium text-cyan-300">
                  09:00 – 22:00
                </span>
                <span className="absolute right-3 top-3 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-bold text-pink-300">
                  {room.hourly_rate} ₴ / год
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{room.room_name}</h3>
                  <p className="mt-1.5 text-sm text-slate-300/85 leading-relaxed">
                    {room.description || 'Сучасна репетиційна кімната з професійною звукоізоляцією.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-200 border-t border-white/10 pt-3">
                    <span className="flex items-center gap-1.5">
                      <Maximize2 className="h-4 w-4 text-purple-400" /> {room.area_sqm} м²
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-cyan-400" /> До {room.capacity} музикантів
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDetailsModalData({ room, index: idx })}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-slate-100 hover:bg-white/12 hover:border-cyan-400/40 transition"
                    >
                      <Info className="h-3.5 w-3.5 text-cyan-400" /> Докладніше
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectBooking({ roomId: room.room_id })}
                      className="rounded-xl border border-purple-400/40 bg-purple-500/20 py-2.5 text-xs font-bold text-purple-100 hover:bg-purple-500/35 transition"
                    >
                      Забронювати
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ПАРК МУЗИЧНОГО ОБЛАДНАННЯ — FULL-BLEED СТРІЧКА */}
      <section ref={eqSectionRef} className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
              <Mic2 className="h-7 w-7 text-pink-400" /> Парк музичного обладнання
            </h2>
            <p className="mt-1 text-sm text-slate-300/80">
              Доступне для додаткової оренди під час оформлення репетиційної сесії
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollEquipmentBy(-340)}
              aria-label="Прокрутити вліво"
              className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-slate-200 hover:bg-white/15 hover:text-white backdrop-blur-md transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollEquipmentBy(340)}
              aria-label="Прокрутити вправо"
              className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-slate-200 hover:bg-white/15 hover:text-white backdrop-blur-md transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div
            ref={eqScrollRef}
            onWheel={handleEquipmentWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
            className="equipment-edge-mask no-scrollbar flex gap-5 overflow-x-auto px-10 py-3 cursor-grab active:cursor-grabbing select-none"
          >
            {equipment.map((eq) => (
              <div
                key={eq.equipment_id}
                className="glass-card min-w-[265px] max-w-[265px] shrink-0 rounded-3xl p-6 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block rounded-lg bg-cyan-500/20 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                    {eq.category}
                  </span>
                  <h3 className="mt-3.5 text-base font-bold text-white leading-snug">{eq.equipment_name}</h3>
                  <p className="mt-1.5 text-xs text-slate-300/70">Інв. № {eq.inventory_number}</p>
                </div>
                <div className="mt-6 border-t border-white/10 pt-3.5 text-sm font-extrabold text-pink-400">
                  +{eq.rental_price} ₴ <span className="text-xs font-normal text-slate-300/80">/ сесія</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ПОВНОЕКРАННЕ МОДАЛЬНЕ ВІКНО «ДОКЛАДНІШЕ ПРО КІМНАТУ ТА ЛОКАЦІЮ» ЧЕРЕЗ PORTAL */}
      {detailsModalData &&
        extendedInfo &&
        createPortal(
          <div
            onClick={() => setDetailsModalData(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-panel relative w-full max-w-6xl rounded-3xl overflow-hidden border border-white/15 shadow-2xl grid grid-cols-1 lg:grid-cols-12"
            >
              {/* ЛІВА КОЛОНКА: Фото залу, точна адреса локації та переваги */}
              <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 bg-white/[0.02]">
                <div>
                  <div className="relative h-44 sm:h-48 w-full">
                    <img
                      src={ROOM_PHOTOS[detailsModalData.index % ROOM_PHOTOS.length]}
                      alt={detailsModalData.room.room_name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0818] via-[#0b0818]/35 to-transparent" />

                    <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-2">
                      <div>
                        <span className="inline-block rounded-full border border-cyan-400/40 bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-bold text-cyan-200 backdrop-blur-md mb-1">
                          {extendedInfo.branchName}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                          {detailsModalData.room.room_name}
                        </h2>
                      </div>

                      <div className="shrink-0 rounded-xl bg-black/65 border border-pink-500/35 px-3 py-1.5 backdrop-blur-md text-right">
                        <div className="text-sm sm:text-base font-extrabold text-pink-300">
                          {detailsModalData.room.hourly_rate} ₴/год
                        </div>
                        <div className="text-[10px] text-slate-300">
                          {detailsModalData.room.area_sqm} м² • до {detailsModalData.room.capacity} осіб
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Адреса та маршрут */}
                  <div className="p-4 sm:p-5 space-y-2.5 text-xs">
                    <div className="rounded-2xl border border-pink-500/30 bg-pink-500/10 p-3.5 space-y-2">
                      <div className="font-bold text-pink-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-pink-400" /> Локація та навігація
                      </div>
                      <div className="text-white font-bold leading-snug">{extendedInfo.address}</div>
                      <div className="flex items-start gap-2 text-cyan-200 text-[11px] leading-snug">
                        <Train className="h-3.5 w-3.5 shrink-0 text-cyan-400 mt-0.5" />
                        <span>{extendedInfo.metroInfo}</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-300 text-[11px] leading-snug">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-purple-400 mt-0.5" />
                        <span>{extendedInfo.floorAndAccess} • 09:00 – 22:00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Нижні теги комфорту */}
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-200">
                    <Wifi className="h-3 w-3 text-cyan-400" /> Wi-Fi 1 Гбіт/с
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-200">
                    <Coffee className="h-3 w-3 text-pink-400" /> Лаунж і кава
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-200">
                    <Sparkles className="h-3 w-3 text-purple-400" /> Клімат-контроль
                  </span>
                </div>
              </div>

              {/* ПРАВА КОЛОНКА: Детальний опис залу, вбудована апаратура та кнопки */}
              <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      Про локацію та акустичні особливості залу
                    </h3>
                    <button
                      type="button"
                      onClick={() => setDetailsModalData(null)}
                      aria-label="Закрити"
                      className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:text-white hover:bg-white/15 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-200/90 leading-relaxed">
                    {extendedInfo.paragraphs.map((text, i) => (
                      <p key={i}>{text}</p>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-2">
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Volume2 className="h-3.5 w-3.5" /> Базове обладнання, що входить у вартість залу:
                    </div>
                    <ul className="grid gap-1.5 sm:grid-cols-2 text-[11px] text-slate-200">
                      {extendedInfo.includedGear.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setDetailsModalData(null)}
                    className="w-1/3 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10 transition"
                  >
                    Закрити
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = detailsModalData.room.room_id;
                      setDetailsModalData(null);
                      onSelectBooking({ roomId: targetId });
                    }}
                    className="w-2/3 neon-gradient-btn flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg"
                  >
                    Забронювати {detailsModalData.room.room_name} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );

  function setEndTimeHelper(nextH: number, m: number) {
    setCheckEndTime(`${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
};