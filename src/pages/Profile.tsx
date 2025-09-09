
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Headphones, Sparkles, Languages } from "lucide-react";
import { CurvedHeader } from "@/components/ui/curved-header";
import { FooterNav } from "@/components/ui/footer-nav";
import { ActionCard } from "@/components/ui/action-card";
import { SettingsItem } from "@/components/ui/settings-item";
import { useLanguage } from "@/contexts/LanguageContext";

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentLanguage, toggleLanguage } = useLanguage();

  const handleSupportClick = () => {
    console.log("Chat with Support clicked");
    // Navigate to support page
  };

  const handleFeatureRequestClick = () => {
    console.log("Request Feature clicked");
    // Navigate to feature request page
  };

  const handleHistoryClick = () => {
    navigate("/history");
  };

  const handleLanguageClick = () => {
    toggleLanguage();
  };

  return (
    <div className="min-h-screen bg-surface-alt">
      {/* Header */}
      <CurvedHeader
        title={t('profile')}
        subtitle={t('welcomeBack', { name: 'Ahmed' })}
      />

      {/* Content */}
      <div className="px-6 pt-6 pb-32">
        {/* Action Cards */}
        <div className="space-y-4 mb-8">
          <ActionCard
            title={t('chatWithSupport')}
            subtitle={t('getHelpFromTeam')}
            icon={Headphones}
            variant="support"
            onClick={handleSupportClick}
          />
          
          <ActionCard
            title={t('requestFeature')}
            subtitle={t('suggestNewFeatures')}
            icon={Sparkles}
            variant="feature"
            onClick={handleFeatureRequestClick}
          />
        </div>

        {/* Settings Section */}
        <div className="bg-surface-card rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-text-primary font-semibold text-lg">{t('settings')}</h2>
          </div>
          
          <SettingsItem
            label={t('history')}
            onClick={handleHistoryClick}
          />
          
          <SettingsItem
            label={`${t('language')} (${currentLanguage === 'en' ? 'English' : 'العربية'})`}
            onClick={handleLanguageClick}
            icon={Languages}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0">
        <FooterNav />
      </div>
    </div>
  );
};

export default Profile;
