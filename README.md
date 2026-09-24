# АХА — Capacitor App (Mac-гүйгээр App Store/Play Store-д тавих)

Таны HTML/React app-ийг гар утасны app болгож, **Mac компьютергүйгээр** дэлгүүрт байршуулах бүрэн заавар.

---

## 📦 Энэ хавтаст юу байгаа вэ

```
aha-capacitor/
├── www/                    ← Таны бэлэн app (offline ажиллана)
│   ├── index.html
│   ├── bundle.js           ← Бүх асуулт + логик (precompiled)
│   ├── react.min.js
│   └── react-dom.min.js
├── package.json
├── capacitor.config.ts
└── README.md (энэ файл)
```

`www/` хавтас бол таны бүрэн app. Бүх 368 асуулт `bundle.js` дотор шигдсэн тул **интернетгүй ажиллана** (зөвхөн фонт онлайн ачаалагдана).

---

## 🛠 АЛХАМ 1: Орчноо бэлдэх (Windows дээр)

### Node.js суулгах
[nodejs.org](https://nodejs.org) → LTS хувилбар татаж суулгана.

### Төслийг бэлдэх
```bash
cd aha-capacitor
npm install
```

---

## 🤖 АЛХАМ 2: Android app болгох (Mac хэрэггүй!)

```bash
# Android платформ нэмэх
npm run add:android

# www доторх өөрчлөлтийг хуулах
npm run sync
```

### Android Studio-гүйгээр build хийх
[Android Studio](https://developer.android.com/studio) суулгавал шууд build хийнэ. Эсвэл командаар:

```bash
cd android
./gradlew assembleRelease      # APK
./gradlew bundleRelease         # AAB (Play Store-д)
```

Гарсан файл: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🍎 АЛХАМ 3: iOS app болгох (Mac-гүйгээр — Cloud Build)

iOS build хийхэд Mac хэрэгтэй боловч **cloud build үйлчилгээ** үүнийг үүлэн дэх Mac дээр хийнэ.

### Сонголт A: Codemagic (хамгийн хялбар)

1. iOS платформ нэмэх:
   ```bash
   npm run add:ios
   npm run sync
   ```
2. Төслөө **GitHub**-д push хийх
3. [codemagic.io](https://codemagic.io) → GitHub-аар нэвтрэх
4. Төслөө сонгоод **Capacitor/iOS** workflow сонгох
5. Apple Developer данс холбох → Codemagic автоматаар build, sign хийнэ
6. Шууд App Store Connect руу илгээнэ

### Сонголт B: Capawesome Cloud (Capacitor-д тусгай)

1. [capawesome.io](https://capawesome.io) → бүртгүүлэх
2. Console → **Build from Git** → iOS сонгох
3. Build дууссаны дараа `.ipa` татаж авах эсвэл шууд App Store-д илгээх

---

## 🔑 АЛХАМ 4: Apple Developer данс ($99/жил)

1. [developer.apple.com/programs](https://developer.apple.com/programs) → Enroll
2. $99 төлнө (нэг данс = хязгааргүй app)
3. App Store Connect дотор шинэ app үүсгэх:
   - Bundle ID: `mn.aha.quiz` (capacitor.config.ts-тэй ижил)
   - Нэр: АХА

---

## 🎨 АЛХАМ 5: Шаардлагатай материал

### App Icon (1024×1024px PNG)
Онлайн хэрэгсэл ашиглаж бүх хэмжээ үүсгэх:
- [icon.kitchen](https://icon.kitchen) — нэг зургаас бүх хэмжээ
- [easyappicon.com](https://easyappicon.com)

Гаргасан icon-уудыг:
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Android: `android/app/src/main/res/`

### Screenshot
Утсан дээр app-аа нээгээд дэлгэцийн зураг авна, эсвэл cloud build-н simulator ашиглана.
- iPhone 6.7": 1290×2796px
- Android: 1080×1920px

### Privacy Policy URL (заавар)
Үнэгүй үүсгэх: [freeprivacypolicy.com](https://www.freeprivacypolicy.com)
Энгийн вэб (GitHub Pages, Google Sites) дээр байршуулна.

---

## 🤖 АЛХАМ 6: Play Store-д тавих (Android)

1. [Google Play Console](https://play.google.com/console) → $25 (нэг удаа)
2. Шинэ app үүсгэх
3. `app-release.aab` upload хийх
4. Store listing, screenshot, тайлбар бөглөх
5. Content rating асуулга бөглөх
6. **Production → Review** илгээх

⏱ Хянах хугацаа: 1-3 хоног

---

## 🍎 АЛХАМ 7: App Store-д тавих (iOS)

1. Cloud build (Codemagic) → App Store Connect руу build илгээнэ
2. App Store Connect дотор:
   - Screenshot, тайлбар, keyword нэмэх
   - Privacy мэдээлэл бөглөх
   - Age rating асуулга
3. **Submit for Review**

⏱ Хянах хугацаа: 1-3 хоног

---

## ⚠️ Чухал санамж

### PLUS эрх (төлбөр) тухай
Хэрэв та апп дотроо PLUS эрхийг **QR/QPay**-аар зарвал Apple татгалзаж магадгүй. Apple-ийн дүрмээр **дижитал бараа** (PLUS эрх гэх мэт)-г зарахдаа Apple-ийн **In-App Purchase** ашиглах ёстой (орлогын 15-30% Apple авна).

Хоёр сонголт:
- **In-App Purchase** нэмэх (Apple-ийн дүрэмд нийцнэ)
- Эсвэл PLUS-ийг бүрэн үнэгүй болгож, оронд нь зар сурталчилгаа тавих

Google Play дээр илүү уян хатан — гадны төлбөр зарим тохиолдолд зөвшөөрнө.

### Кодоо шинэчлэхэд
`www/` доторх файлыг өөрчилсний дараа заавал:
```bash
npm run sync
```
Дараа нь дахин build хийнэ.

---

## 🎯 Товч дараалал

| Алхам | Юу хийх | Хаана |
|-------|---------|-------|
| 1 | `npm install` | Windows |
| 2 | Android нэмэх, AAB build | Windows |
| 3 | iOS — GitHub + Codemagic | Cloud |
| 4 | Apple Developer $99 | developer.apple.com |
| 5 | Icon, screenshot, privacy | Онлайн |
| 6 | Play Store $25 + submit | Play Console |
| 7 | App Store submit | App Store Connect |

**Mac огт хэрэггүй** — бүгд Windows + Cloud build-ээр хийгдэнэ! 🎉
