# АХА — In-App Purchase (PLUS эрх) тохируулах заавар

PLUS эрхийг RevenueCat ашиглан бодит худалдан авалт болгох бүрэн заавар.
**Backend сервер хэрэггүй** — RevenueCat бүгдийг хийнэ.

---

## 📋 Ерөнхий ойлголт

```
Хэрэглэгч "PLUS авах" дарна
       ↓
RevenueCat → App Store / Google Play төлбөр
       ↓
Төлбөр амжилттай → "plus" entitlement идэвхжинэ
       ↓
App PLUS нээнэ (сервер шаардлагагүй)
```

---

## 🔧 АЛХАМ 1: RevenueCat данс үүсгэх

1. [revenuecat.com](https://www.revenuecat.com) → үнэгүй бүртгүүлэх
   (Сард $2,500 хүртэл орлоготой бол үнэгүй)
2. Шинэ **Project** үүсгэх: "АХА"

---

## 🍎 АЛХАМ 2: App Store Connect тохиргоо

1. App Store Connect → таны app → **Subscriptions**
2. Шинэ **Auto-Renewable Subscription** үүсгэх:
   - Reference Name: `AHA PLUS Monthly`
   - Product ID: `aha_plus_monthly`
   - Үнэ: ₮19,900 (эсвэл тохирох tier)
3. **App Store Connect API Key** үүсгэх (RevenueCat-д холбоход)

---

## 🤖 АЛХАМ 3: Google Play тохиргоо

1. Play Console → таны app → **Monetize → Subscriptions**
2. Шинэ subscription үүсгэх:
   - Product ID: `aha_plus_monthly`
   - Үнэ: ₮19,900
3. **Service Account** үүсгэж RevenueCat-д холбох

---

## ⚙️ АЛХАМ 4: RevenueCat дотор тохируулах

1. RevenueCat → **Entitlements** → шинэ үүсгэх:
   - Identifier: `plus` ← (iap.js доторхтой ижил байх ёстой!)

2. **Products** → App Store, Play Store-ийн product-уудаа холбох:
   - `aha_plus_monthly` (iOS)
   - `aha_plus_monthly` (Android)

3. **Offerings** → `default` offering үүсгээд дээрх product-уудыг нэмэх

4. **API Keys** хуулж авах:
   - iOS: `appl_xxxxx`
   - Android: `goog_xxxxx`

---

## 📝 АЛХАМ 5: Кодод API key оруулах

`www/iap.js` файлыг нээгээд дээд талын тохиргоог солих:

```javascript
const REVENUECAT_API_KEY_IOS = 'appl_ТАНЫ_ТҮЛХҮҮР';
const REVENUECAT_API_KEY_ANDROID = 'goog_ТАНЫ_ТҮЛХҮҮР';
const ENTITLEMENT_ID = 'plus';        // RevenueCat entitlement-тэй ижил
const OFFERING_ID = 'default';
```

---

## 🔌 АЛХАМ 6: Plugin суулгах

```bash
cd aha-capacitor
npm install
npx cap sync
```

`@revenuecat/purchases-capacitor` plugin аль хэдийн package.json-д нэмэгдсэн.

### Android тусгай тохиргоо
`android/app/src/main/AndroidManifest.xml` дотор Activity-ийн launchMode-ийг шалгах:
```xml
<activity android:launchMode="singleTop" ...>
```
(Төлбөрийн баталгаажуулалт банкны апп руу шилжихэд цуцлагдахаас сэргийлнэ)

---

## ✅ АЛХАМ 7: Турших

1. **iOS**: App Store Connect → Sandbox tester үүсгээд тест худалдан авалт хийнэ
2. **Android**: Play Console → License testing → тест данс нэмнэ

Тест худалдан авалт нь жинхэнэ мөнгө авахгүй!

---

## ⚠️ Чухал санамжууд

### "Худалдан авалт сэргээх" товч
App Store ЗААВАЛ шаарддаг. Аль хэдийн нэмэгдсэн (paywall дотор).

### Subscription мэдээлэл
Paywall дээр үнэ, сунгалт, цуцлах мэдээлэл харагдах ёстой. Аль хэдийн нэмэгдсэн.

### Terms & Privacy линк
`modals.jsx` дотор `https://example.com/terms` ба `/privacy`-г өөрийн жинхэнэ хаягаар солих.

### Веб preview
Веб дээр (browser) IAP ажиллахгүй — туршилтын горим руу автоматаар шилжинэ. Зөвхөн жинхэнэ утсан дээр бодит худалдан авалт хийгдэнэ.

---

## 🎯 Товч дараалал

| Алхам | Юу хийх |
|-------|---------|
| 1 | RevenueCat данс үүсгэх |
| 2 | App Store Connect subscription |
| 3 | Google Play subscription |
| 4 | RevenueCat-д entitlement + product холбох |
| 5 | iap.js-д API key оруулах |
| 6 | npm install && npx cap sync |
| 7 | Sandbox дээр турших |

Бэлэн болсны дараа PLUS эрх жинхэнэ худалдан авалтаар ажиллана! 🎉
