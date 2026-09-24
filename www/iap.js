// iap.js — RevenueCat In-App Purchase integration for АХА
// Энэ файл нь Capacitor app дотор PLUS эрхийг бодит худалдан авалтаар зарна.
//
// АЖИЛЛАХ ЗАРЧИМ:
// 1. App нээгдэхэд RevenueCat-тай холбогдоно (configure)
// 2. Хэрэглэгч "PLUS авах" дарахад худалдан авалт эхэлнэ (purchasePackage)
// 3. RevenueCat худалдан авалтыг баталгаажуулж, "plus" entitlement өгнө
// 4. App тэр entitlement-ийг шалгаж PLUS нээнэ
//
// СЕРВЕР ХЭРЭГГҮЙ — RevenueCat бүгдийг хийнэ.

// ============================================================
// ⚙️ ТОХИРГОО — эдгээрийг RevenueCat dashboard-аас авна
// ============================================================
const REVENUECAT_API_KEY_IOS = 'appl_XXXXXXXXXXXXXXXXXXXX';      // App Store API key
const REVENUECAT_API_KEY_ANDROID = 'goog_XXXXXXXXXXXXXXXXXXXX';  // Play Store API key
const ENTITLEMENT_ID = 'plus';      // RevenueCat dashboard дээр үүсгэх entitlement нэр
const OFFERING_ID = 'default';      // RevenueCat offering нэр

// Capacitor + RevenueCat plugin байгаа эсэхийг шалгах
const hasIAP = () => {
  return typeof window !== 'undefined'
    && window.Capacitor
    && window.Capacitor.isNativePlatform
    && window.Capacitor.isNativePlatform();
};

let Purchases = null;
let isConfigured = false;

// ============================================================
// 1. ЭХЛҮҮЛЭХ — app нээгдэхэд дуудна
// ============================================================
async function initIAP() {
  if (!hasIAP()) {
    console.log('[IAP] Веб орчинд ажиллаж байна — IAP идэвхгүй');
    return false;
  }
  try {
    const mod = await import('@revenuecat/purchases-capacitor');
    Purchases = mod.Purchases;

    const platform = window.Capacitor.getPlatform();
    const apiKey = platform === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

    await Purchases.configure({ apiKey });
    isConfigured = true;
    console.log('[IAP] RevenueCat тохируулагдлаа:', platform);
    return true;
  } catch (e) {
    console.error('[IAP] Эхлүүлэхэд алдаа:', e);
    return false;
  }
}

// ============================================================
// 2. PLUS эрхтэй эсэхийг шалгах
// ============================================================
async function checkPlusStatus() {
  if (!isConfigured) return false;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const active = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return active !== undefined;
  } catch (e) {
    console.error('[IAP] Статус шалгахад алдаа:', e);
    return false;
  }
}

// ============================================================
// 3. PLUS-ийн үнэ авах (paywall дээр харуулах)
// ============================================================
async function getPlusPrice() {
  if (!isConfigured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (current && current.availablePackages.length > 0) {
      const pkg = current.availablePackages[0];
      return {
        package: pkg,
        priceString: pkg.product.priceString,   // жишээ: "₮19,900"
        title: pkg.product.title,
      };
    }
    return null;
  } catch (e) {
    console.error('[IAP] Үнэ авахад алдаа:', e);
    return null;
  }
}

// ============================================================
// 4. PLUS худалдан авах
// ============================================================
async function purchasePlus() {
  if (!isConfigured) {
    return { success: false, error: 'IAP тохируулагдаагүй' };
  }
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current || current.availablePackages.length === 0) {
      return { success: false, error: 'Багц олдсонгүй' };
    }
    const pkg = current.availablePackages[0];
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });

    const active = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (active !== undefined) {
      return { success: true };
    }
    return { success: false, error: 'Эрх идэвхжсэнгүй' };
  } catch (e) {
    // Хэрэглэгч цуцалсан бол алдаа биш
    if (e.code === 'PURCHASE_CANCELLED' || e.userCancelled) {
      return { success: false, cancelled: true };
    }
    console.error('[IAP] Худалдан авахад алдаа:', e);
    return { success: false, error: e.message || 'Худалдан авалт амжилтгүй' };
  }
}

// ============================================================
// 5. Худалдан авалтыг сэргээх (App Store шаарддаг!)
// ============================================================
async function restorePurchases() {
  if (!isConfigured) return { success: false };
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const active = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return { success: active !== undefined };
  } catch (e) {
    console.error('[IAP] Сэргээхэд алдаа:', e);
    return { success: false, error: e.message };
  }
}

// Global болгож app.jsx-аас дуудах боломжтой болгох
if (typeof window !== 'undefined') {
  window.AHA_IAP = {
    init: initIAP,
    checkStatus: checkPlusStatus,
    getPrice: getPlusPrice,
    purchase: purchasePlus,
    restore: restorePurchases,
    hasIAP,
  };
}
