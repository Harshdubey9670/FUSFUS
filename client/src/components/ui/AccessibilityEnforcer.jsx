import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

export function AccessibilityEnforcer() {
  const { settings } = useSelector(state => state.auth);
  const { i18n } = useTranslation();

  useEffect(() => {
    const root = document.documentElement;
    const accessSettings = settings?.accessibility;

    if (accessSettings) {
      // Handle High Contrast
      if (accessSettings.highContrast) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }

      // Handle Reduce Motion
      if (accessSettings.reduceMotion) {
        root.classList.add("reduce-motion");
      } else {
        root.classList.remove("reduce-motion");
      }

      // Handle Font Size
      root.classList.remove("font-small", "font-medium", "font-large");
      if (accessSettings.fontSize) {
        root.classList.add(`font-${accessSettings.fontSize}`);
      } else {
        root.classList.add("font-medium");
      }
    }
    
    // Handle Language and RTL support
    const lang = settings?.language?.preferred;
    if (lang) {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
      
      root.lang = lang;
      if (lang === 'ar') {
        root.dir = 'rtl';
      } else {
        root.dir = 'ltr';
      }
    }

  }, [settings?.accessibility, settings?.language?.preferred, i18n]);

  return null; // This component just manages DOM side effects
}
