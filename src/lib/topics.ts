// Албан ёсны сэдвүүд (аппын TOPICS-той нийцнэ).
export const TOPICS = [
  {
    "id": "mn_history",
    "name": "Монголын түүх",
    "short": "Түүх",
    "color": "#8B5CF6"
  },
  {
    "id": "world_history",
    "name": "Дэлхийн түүх",
    "short": "Дэлхий",
    "color": "#16A34A"
  },
  {
    "id": "science",
    "name": "Шинжлэх ухаан",
    "short": "Шинжлэх",
    "color": "#2563EB"
  },
  {
    "id": "sport",
    "name": "Спорт",
    "short": "Спорт",
    "color": "#F97316"
  },
  {
    "id": "art",
    "name": "Урлаг",
    "short": "Урлаг",
    "color": "#EC4899"
  },
  {
    "id": "general",
    "name": "Танин мэдэхүй",
    "short": "Танин",
    "color": "#0D9488"
  },
  {
    "id": "logic",
    "name": "Логик, оньсого",
    "short": "Логик",
    "color": "#CA8A04"
  },
  {
    "id": "space",
    "name": "Гариг эрхэс",
    "short": "Сансар",
    "color": "#6366F1"
  },
  {
    "id": "geo",
    "name": "Газар зүй",
    "short": "Газар",
    "color": "#0891B2"
  },
  {
    "id": "cinema",
    "name": "Кино, ТВ",
    "short": "Кино",
    "color": "#E11D48"
  },
  {
    "id": "music",
    "name": "Хөгжим",
    "short": "Хөгжим",
    "color": "#C026D3"
  },
  {
    "id": "math",
    "name": "Математик",
    "short": "Матем",
    "color": "#D97706"
  },
  {
    "id": "society",
    "name": "Нийгэм, эдийн засаг",
    "short": "Нийгэм",
    "color": "#475569"
  }
] as const;

export const TOPIC_IDS: string[] = TOPICS.map((t) => t.id);
