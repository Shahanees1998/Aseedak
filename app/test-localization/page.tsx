'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import RTLWrapper from '@/components/RTLWrapper';

const TestLocalization: React.FC = () => {
  const { t, locale, changeLanguage, isRTL, direction } = useTranslation();

  return (
    <RTLWrapper className="p-4">
      <div className="max-w-4xl mx-auto">
        <Card title="Localization Test" className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Test Page</h2>
            <LanguageSwitcher variant="button" showFlags={true} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Current Settings">
              <div className="space-y-2">
                <p><strong>Current Locale:</strong> {locale}</p>
                <p><strong>Direction:</strong> {direction}</p>
                <p><strong>RTL Mode:</strong> {isRTL ? 'Yes' : 'No'}</p>
                <p><strong>LocalStorage:</strong> {typeof window !== 'undefined' ? localStorage.getItem('locale') : 'N/A'}</p>
              </div>
            </Card>

            <Card title="Sample Translations">
              <div className="space-y-2">
                <p><strong>Admin Title:</strong> {t('admin.title')}</p>
                <p><strong>Quick Actions:</strong> {t('admin.quickActions')}</p>
                <p><strong>Dashboard:</strong> {t('navigation.dashboard')}</p>
                <p><strong>Game Management:</strong> {t('navigation.gameManagement')}</p>
                <p><strong>Loading:</strong> {t('common.loading')}</p>
              </div>
            </Card>

            <Card title="Language Switching">
              <div className="space-y-4">
                <p>Click the buttons below to test language switching:</p>
                <div className="flex gap-2">
                  <Button 
                    label="English" 
                    onClick={() => changeLanguage('en')}
                    severity={locale === 'en' ? 'info' : 'secondary'}
                    outlined={locale !== 'en'}
                  />
                  <Button 
                    label="العربية" 
                    onClick={() => changeLanguage('ar')}
                    severity={locale === 'ar' ? 'info' : 'secondary'}
                    outlined={locale !== 'ar'}
                  />
                </div>
              </div>
            </Card>

            <Card title="RTL Test">
              <div className="space-y-4">
                <p>This text should align correctly based on the selected language:</p>
                <div className="bg-gray-100 p-4 rounded">
                  <p className="text-left">Left aligned text</p>
                  <p className="text-right">Right aligned text</p>
                  <p className="text-center">Center aligned text</p>
                </div>
                <p>In Arabic mode, the layout should be right-to-left.</p>
              </div>
            </Card>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Use the language switcher in the top-right to change languages</li>
              <li>Notice how the text changes immediately</li>
              <li>In Arabic mode, the layout direction changes to RTL</li>
              <li>Refresh the page - your language preference should be remembered</li>
              <li>Check localStorage in browser dev tools to see the stored preference</li>
            </ol>
          </div>
        </Card>
      </div>
    </RTLWrapper>
  );
};

export default TestLocalization;
