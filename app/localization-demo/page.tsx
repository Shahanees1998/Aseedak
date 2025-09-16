'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import RTLWrapper from '@/components/RTLWrapper';

const LocalizationDemo: React.FC = () => {
  const { t, locale, isRTL, direction } = useTranslation();

  const difficultyOptions = [
    { label: t('admin.difficulty'), value: 'easy' },
    { label: t('admin.active'), value: 'medium' },
    { label: t('admin.inactive'), value: 'hard' },
  ];

  return (
    <RTLWrapper className="p-4">
      <div className="max-w-4xl mx-auto">
        <Card title={t('landing.title')} className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{t('landing.subtitle')}</h2>
            <LanguageSwitcher variant="button" showFlags={true} />
          </div>
          
          <Divider />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authentication Section */}
            <Card title={t('auth.login.title')} className="h-full">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('auth.login.email')}
                  </label>
                  <InputText 
                    placeholder={t('auth.login.email')}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('auth.login.password')}
                  </label>
                  <Password 
                    placeholder={t('auth.login.password')}
                    className="w-full"
                    toggleMask
                  />
                </div>
                
                <div className="flex items-center">
                  <Checkbox inputId="remember" checked={false} />
                  <label htmlFor="remember" className="ml-2">
                    {t('auth.login.rememberMe')}
                  </label>
                </div>
                
                <Button 
                  label={t('auth.login.signIn')}
                  className="w-full"
                />
                
                <div className="text-center">
                  <Button 
                    label={t('auth.login.forgotPassword')}
                    link
                    className="p-0"
                  />
                </div>
              </div>
            </Card>

            {/* Game Section */}
            <Card title={t('game.createRoom.title')} className="h-full">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('game.createRoom.roomName')}
                  </label>
                  <InputText 
                    placeholder={t('game.createRoom.roomName')}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('game.createRoom.maxPlayers')}
                  </label>
                  <Dropdown 
                    options={[2, 3, 4, 5, 6, 7, 8]}
                    placeholder={t('game.createRoom.maxPlayers')}
                    className="w-full"
                  />
                </div>
                
                <Button 
                  label={t('game.createRoom.createRoom')}
                  className="w-full"
                />
              </div>
            </Card>

            {/* Admin Section */}
            <Card title={t('admin.title')} className="h-full">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.word1')}
                  </label>
                  <InputText 
                    placeholder={t('admin.word1')}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.category')}
                  </label>
                  <Dropdown 
                    options={difficultyOptions}
                    placeholder={t('admin.category')}
                    className="w-full"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    label={t('common.save')}
                    className="flex-1"
                  />
                  <Button 
                    label={t('common.cancel')}
                    severity="secondary"
                    outlined
                    className="flex-1"
                  />
                </div>
              </div>
            </Card>

            {/* Store Section */}
            <Card title={t('store.title')} className="h-full">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    {t('store.characterPacks')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('store.description')}
                  </p>
                  <div className="text-2xl font-bold text-primary mb-4">
                    {t('store.price')}: $9.99
                  </div>
                  <Button 
                    label={t('store.buyNow')}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
          </div>

          <Divider className="my-6" />

          {/* Current Locale Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Current Localization Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Current Locale:</strong> {locale}
              </div>
              <div>
                <strong>Direction:</strong> {direction}
              </div>
              <div>
                <strong>RTL Mode:</strong> {isRTL ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Sample Translation:</strong> {t('common.loading')}
              </div>
            </div>
          </div>

          {/* How to Play Section */}
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">{t('landing.howToPlay.title')}</h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                <span>{t('landing.howToPlay.step1')}</span>
              </div>
              <div className="flex items-start">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                <span>{t('landing.howToPlay.step2')}</span>
              </div>
              <div className="flex items-start">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                <span>{t('landing.howToPlay.step3')}</span>
              </div>
              <div className="flex items-start">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                <span>{t('landing.howToPlay.step4')}</span>
              </div>
              <div className="flex items-start">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                <span>{t('landing.howToPlay.step5')}</span>
              </div>
              <div className="flex items-start">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">6</span>
                <span>{t('landing.howToPlay.step6')}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </RTLWrapper>
  );
};

export default LocalizationDemo;
