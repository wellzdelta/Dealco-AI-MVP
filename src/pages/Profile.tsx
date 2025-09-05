
import React from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, Sparkles } from "lucide-react";
import { CurvedHeader } from "@/components/ui/curved-header";
import { FooterNav } from "@/components/ui/footer-nav";
import { ActionCard } from "@/components/ui/action-card";
import { SettingsItem } from "@/components/ui/settings-item";

const Profile = () => {
  const navigate = useNavigate();

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
    console.log("Language clicked");
    // Navigate to language selection
  };

  return (
    <div className="min-h-screen bg-surface-alt">
      {/* Header */}
      <CurvedHeader
        title="Profile"
        subtitle="Welcome back , Ahmed"
      />

      {/* Content */}
      <div className="px-6 pt-6 pb-32">
        {/* Action Cards */}
        <div className="space-y-4 mb-8">
          <ActionCard
            title="Chat with Support"
            subtitle="Get help from our team"
            icon={Headphones}
            variant="support"
            onClick={handleSupportClick}
          />
          
          <ActionCard
            title="Request Feature"
            subtitle="Suggest new features"
            icon={Sparkles}
            variant="feature"
            onClick={handleFeatureRequestClick}
          />
        </div>

        {/* Settings Section */}
        <div className="bg-surface-card rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-text-primary font-semibold text-lg">Settings</h2>
          </div>
          
          <SettingsItem
            label="History"
            onClick={handleHistoryClick}
          />
          
          <SettingsItem
            label="Language"
            onClick={handleLanguageClick}
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
