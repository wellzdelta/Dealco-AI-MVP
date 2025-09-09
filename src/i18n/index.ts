import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      history: "History",
      profile: "Profile",
      loading: "Loading",
      
      // History page
      clearAll: "Clear All",
      nothingScanned: "Nothing scanned yet.",
      scanProduct: "Scan a product",
      
      // Profile page
      welcomeBack: "Welcome back, {{name}}",
      chatWithSupport: "Chat with Support",
      getHelpFromTeam: "Get help from our team",
      requestFeature: "Request Feature",
      suggestNewFeatures: "Suggest new features",
      settings: "Settings",
      language: "Language",
      
      // Loading page
      processingScan: "Processing scan...",
      
      // Scanner
      positionDocument: "Position document in frame",
      
      // Common
      scan: "Scan",
      gallery: "Gallery",
      flash: "Flash"
    }
  },
  ar: {
    translation: {
      // Navigation
      history: "السجل",
      profile: "الملف الشخصي",
      loading: "جاري التحميل",
      
      // History page
      clearAll: "مسح الكل",
      nothingScanned: "لم يتم مسح أي شيء بعد.",
      scanProduct: "مسح منتج",
      
      // Profile page
      welcomeBack: "مرحباً بعودتك، {{name}}",
      chatWithSupport: "التحدث مع الدعم",
      getHelpFromTeam: "احصل على مساعدة من فريقنا",
      requestFeature: "طلب ميزة",
      suggestNewFeatures: "اقترح ميزات جديدة",
      settings: "الإعدادات",
      language: "اللغة",
      
      // Loading page
      processingScan: "جاري معالجة المسح...",
      
      // Scanner
      positionDocument: "ضع المستند في الإطار",
      
      // Common
      scan: "مسح",
      gallery: "المعرض",
      flash: "الفلاش"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    }
  });

export default i18n;