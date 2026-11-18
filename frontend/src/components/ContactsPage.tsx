import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Train,
  Car,
  Sparkles,
  CheckCircle2,
  Building2,
  Headphones,
} from 'lucide-react';

interface ContactsPageProps {
  onGoToRooms: () => void;
}

const STUDIO_LOCATIONS = [
  {
    id: 'podil',
    badge: 'Головний комплекс • Локація №1',
    name: 'SoundSpace Central (Поділ)',
    address: 'м. Київ, вул. Нижній Вал, 37/20 (вхід з внутрішнього двору, 1 поверх)',
    metro: '3 хвилини пішки від ст. м. «Контрактова площа»',
    parking: 'Власний заїзд у двір для розвантаження барабанів і підсилювачів, безкоштовна парковка для музикантів.',
    roomsIncluded: 'Studio Red (25 м²), Studio Blue (35 м²)',
    description:
      'Флагманська локація SoundSpace у самому серці Подолу. Приміщення спроєктовано з нуля за принципом «кімната в кімнаті» з плаваючою підлогою та багатошаровою віброізоляцією, що дозволяє грати на повній гучності навіть у пізні вечірні години. На локації облаштовано простору лаунж-зону з кавомашиною, кулером, безкоштовним Wi-Fi та кімнатою для тимчасового зберігання чохлів і педалбордів.',
  },
  {
    id: 'pechersk',
    badge: 'Велика сцена • Локація №2',
    name: 'SoundSpace Pro Stage (Печерськ)',
    address: 'м. Київ, вул. Велика Васильківська, 72, корпус Б (цокольний рівень)',
    metro: '4 хвилини пішки від ст. м. «Олімпійська»',
    parking: 'Зручний під’їзд прямо до вантажних дверей студії, поруч підземний та наземний паркінги.',
    roomsIncluded: 'Main Stage Hall (60 м²) та VIP-кімната звукорежисера',
    description:
      'Просторий репетиційно-концертний павільйон для великих гуртів, кавер-бендів, духових секцій та підготовки до сольних концертів. Висота стелі 4.2 метра забезпечує природне розкриття звуку без стоячих хвиль, а сценічний моніторинг та цифрова консоль дозволяють провести повноцінний саундчек перед туром чи фестивалем.',
  },
  {
    id: 'lukianivka',
    badge: 'Акустика та продакшн • Локація №3',
    name: 'SoundSpace Lab & Acoustic (Лук’янівка)',
    address: 'м. Київ, вул. Січових Стрільців, 52А, 2 поверх',
    metro: '7 хвилин пішки від ст. м. «Лук’янівська»',
    parking: 'Гостьові паркомісця вздовж фасаду будівлі та охоронювана стоянка поруч.',
    roomsIncluded: 'Acoustic Lab (20 м²), Drum & Synth Box (18 м²)',
    description:
      'Камерна студійна локація для вокалістів, барабанщиків, електронних дуетів та пре-продакшну. Зали оснащені професійною припливно-витяжною вентиляцією з рекуперацією повітря, м’яким регульованим неоновим освітленням та можливістю швидкого багатоканального запису репетиційної сесії.',
  },
];

export const ContactsPage: React.FC<ContactsPageProps> = ({ onGoToRooms }) => {
  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [senderMessage, setSenderMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderContact.trim() || !senderMessage.trim()) return;
    setSentSuccess(true);
    setSenderName('');
    setSenderContact('');
    setSenderMessage('');
    setTimeout(() => setSentSuccess(false), 6000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 space-y-14">
      {/* HERO ЗАГОЛОВОК СТОРІНКИ КОНТАКТІВ */}
      <section className="glass-panel rounded-[2rem] p-8 md:p-12 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/35 bg-cyan-500/15 px-4 py-1.5 text-xs font-semibold text-cyan-200">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Локації, контакти та навігація
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
              Де знаходяться студії <span className="neon-text">SoundSpace</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-200/85 leading-relaxed">
              Ми об’єднали три зручні локації в центрі міста, щоб кожен музичний колектив міг обрати зал із потрібною
              площею, акустикою та зручним під’їздом. Адміністратори на зв’язку щодня та готові допомогти з підбором
              обладнання або довгостроковим розкладом репетицій.
            </p>
          </div>

          <button
            type="button"
            onClick={onGoToRooms}
            className="neon-gradient-btn shrink-0 rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-lg"
          >
            Переглянути вільні кімнати →
          </button>
        </div>

        {/* 4 КАРТКИ ШВИДКИХ КОНТАКТІВ */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t border-white/10">
          <div className="glass-card rounded-2xl p-5 space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-300">
              <Phone className="h-5 w-5" />
            </div>
            <div className="text-xs text-slate-400">Телефони адміністратора</div>
            <div className="text-sm font-bold text-white">+380 (67) 555-35-35</div>
            <div className="text-xs font-semibold text-slate-300">+380 (93) 440-12-89</div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
              <Send className="h-5 w-5" />
            </div>
            <div className="text-xs text-slate-400">Месенджери та соцмережі</div>
            <div className="text-sm font-bold text-white">Telegram: @soundspace_kyiv</div>
            <div className="text-xs font-semibold text-slate-300">Instagram: @soundspace.studio</div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
              <Mail className="h-5 w-5" />
            </div>
            <div className="text-xs text-slate-400">Електронна пошта</div>
            <div className="text-sm font-bold text-white">booking@soundspace.ua</div>
            <div className="text-xs font-semibold text-slate-300">Для співпраці та резидентства</div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-xs text-slate-400">Графік роботи студій</div>
            <div className="text-sm font-bold text-white">Щодня: 09:00 – 22:00</div>
            <div className="text-xs font-semibold text-emerald-300">Працюємо без вихідних</div>
          </div>
        </div>
      </section>

      {/* ЛОКАЦІЇ КОЖНОЇ ЗІ СТУДІЙ */}
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-pink-400" /> Наші локації та адреси
          </h2>
          <p className="mt-1 text-sm text-slate-300/80">
            Детальна інформація про розташування кожної студії, найближче метро та заїзд для транспорту
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {STUDIO_LOCATIONS.map((loc) => (
            <div key={loc.id} className="glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <span className="inline-block rounded-full border border-pink-500/35 bg-pink-500/15 px-3 py-1 text-[11px] font-bold text-pink-200">
                  {loc.badge}
                </span>

                <h3 className="text-xl font-extrabold text-white">{loc.name}</h3>

                <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
                  <div className="flex items-start gap-2.5 text-slate-100">
                    <MapPin className="h-4 w-4 shrink-0 text-pink-400 mt-0.5" />
                    <span className="font-semibold">{loc.address}</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-cyan-200">
                    <Train className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                    <span>{loc.metro}</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-300">
                    <Car className="h-4 w-4 shrink-0 text-purple-400 mt-0.5" />
                    <span>{loc.parking}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200/85 leading-relaxed">
                  {loc.description}
                </p>
              </div>

              <div className="border-t border-white/10 pt-4 text-xs">
                <span className="text-slate-400">Зали на локації: </span>
                <span className="font-bold text-cyan-300">{loc.roomsIncluded}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* БЛОК ШВИДКОГО ЗВОРОТНОГО ЗВ'ЯЗКУ */}
      <section className="glass-panel rounded-3xl p-7 md:p-10 grid gap-8 lg:grid-cols-12 items-center">
        <div className="lg:col-span-6 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-xl bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-200">
            <Headphones className="h-4 w-4 text-pink-400" /> Підтримка музикантів
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Маєте запитання щодо техніки чи абонементу для гурту?
          </h2>
          <p className="text-sm text-slate-300/85 leading-relaxed">
            Напишіть нам — адміністратор підкаже, яка саме кімната найкраще підійде під ваш склад, допоможе забронювати
            фіксований графік репетицій на місяць або підготує додаткову комутацію до вашого приїзду.
          </p>
        </div>

        <form onSubmit={handleContactSubmit} className="lg:col-span-6 space-y-3.5 text-xs">
          {sentSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-emerald-200 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              Дякуємо! Ваше повідомлення передано адміністратору студії. Ми зв’яжемося з вами найближчим часом.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Ваше ім’я або назва гурту"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-pink-400 focus:outline-none"
            />
            <input
              required
              type="text"
              value={senderContact}
              onChange={(e) => setSenderContact(e.target.value)}
              placeholder="Телефон або @Telegram"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <textarea
            required
            rows={3}
            value={senderMessage}
            onChange={(e) => setSenderMessage(e.target.value)}
            placeholder="Ваше запитання (наприклад: чи можна залишити барабанне залізо між репетиціями?)..."
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none"
          />

          <button
            type="submit"
            className="neon-gradient-btn w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg"
          >
            Надіслати запитання адміністратору
          </button>
        </form>
      </section>
    </div>
  );
};