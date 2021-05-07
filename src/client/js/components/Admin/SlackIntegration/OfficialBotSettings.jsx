import React from 'react';
import { useTranslation } from 'react-i18next';
import OfficialBotSettingsAccordion from './OfficialbotSettingsAccordion';

const OfficialBotSettings = () => {
  const { t } = useTranslation();

  return (
    <>
      <h2 className="admin-setting-header">{t('admin:slack_integration.official_bot_integration')}</h2>

      <h2 className="admin-setting-header">{t('admin:slack_integration.official_bot_settings')}</h2>

      <div className="my-5 mx-3">
        <OfficialBotSettingsAccordion />
      </div>
    </>

  );
};

export default OfficialBotSettings;
