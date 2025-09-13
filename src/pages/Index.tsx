import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import HomePage from '@/components/HomePage';
import LeadForm from '@/components/LeadForm';
import type { FormData } from '@/components/LeadForm';
import VideoRecorder from '@/components/VideoRecorder';
import SuccessPage from '@/components/SuccessPage';
import { useVideoRecorder } from '@/hooks/useVideoRecorder';
import { useTelegram } from '@/hooks/useTelegram';
import type { LocationData } from '@/hooks/useTelegram';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'home' | 'form' | 'success'>('home');
  const [formData, setFormData] = useState<FormData>({
    parentName: '',
    childName: '',
    age: '',
    phone: '',
    promoterName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string>('');

  const {
    videoBlob,
    isRecording,
    videoURL,
    videoRef,
    startVideoRecording,
    stopRecording,
    retakeVideo,
    resetVideo
  } = useVideoRecorder();

  const { getCurrentLocation, sendToTelegram } = useTelegram();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitData = async () => {
    if (!videoBlob || !formData.parentName || !formData.childName || !formData.phone) {
      alert('Заполните все поля и запишите видео');
      return;
    }

    setIsSubmitting(true);
    setLocationError('');
    
    try {
      // Получаем геолокацию
      let currentLocation: LocationData | null = null;
      try {
        currentLocation = await getCurrentLocation();
        setLocation(currentLocation);
      } catch (locationErr) {
        console.warn('Не удалось получить геолокацию:', locationErr);
        setLocationError((locationErr as Error).message);
      }

      // Отправляем все данные в Telegram
      await sendToTelegram(formData, videoBlob, currentLocation);
      
      setCurrentStep('success');
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Ошибка при отправке данных: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeadSent = () => {
    setCurrentStep('success');
  };

  const resetForm = () => {
    setCurrentStep('home');
    setFormData({
      parentName: '',
      childName: '',
      age: '',
      phone: '',
      promoterName: ''
    });
    resetVideo();
    setLocation(null);
    setLocationError('');
  };

  if (currentStep === 'home') {
    return <HomePage onNewLead={() => setCurrentStep('form')} />;
  }

  if (currentStep === 'success') {
    return <SuccessPage onCreateNewLead={resetForm} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep('home')}
            className="mb-4"
          >
            <Icon name="ArrowLeft" className="mr-2" size={16} />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Новый лид</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Форма анкеты */}
          <LeadForm 
            formData={formData}
            onInputChange={handleInputChange}
          />

          {/* Видеозапись */}
          <VideoRecorder
            isRecording={isRecording}
            videoURL={videoURL}
            videoBlob={videoBlob}
            onStartRecording={startVideoRecording}
            onStopRecording={stopRecording}
            onRetakeVideo={retakeVideo}
            onLeadSent={handleLeadSent}
            videoRef={videoRef}
            formData={formData}
            location={location}
          />
        </div>

        {/* Статус геолокации */}
        {locationError && (
          <Card className="mt-4 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center text-orange-700">
                <Icon name="MapPin" className="mr-2" size={16} />
                <span className="text-sm">{locationError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {location && (
          <Card className="mt-4 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center text-green-700">
                <Icon name="MapPin" className="mr-2" size={16} />
                <span className="text-sm">
                  Местоположение определено (точность: {Math.round(location.accuracy)}м)
                </span>
              </div>
            </CardContent>
          </Card>
        )}


      </div>
    </div>
  );
};

export default Index;