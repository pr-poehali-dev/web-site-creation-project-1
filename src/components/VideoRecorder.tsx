import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { shareVideoToWhatsApp } from '@/utils/whatsapp';
import type { FormData } from './LeadForm';
import type { LocationData } from '@/hooks/useTelegram';
import { useTelegram } from '@/hooks/useTelegram';

interface VideoRecorderProps {
  isRecording: boolean;
  videoURL: string;
  videoBlob: Blob | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRetakeVideo: () => void;
  onShareToTelegram?: (videoBlob: Blob, formData: FormData, location: LocationData | null) => Promise<void>;
  videoRef: React.RefObject<HTMLVideoElement>;
  formData?: FormData;
  location?: LocationData | null;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  isRecording,
  videoURL,
  videoBlob,
  onStartRecording,
  onStopRecording,
  onRetakeVideo,
  onShareToTelegram,
  videoRef,
  formData,
  location
}) => {
  const { getCurrentLocation } = useTelegram();

  const handleShareToWhatsApp = async () => {
    if (!videoBlob) return;
    
    // Получаем актуальное местоположение
    let currentLocation = location;
    if (!currentLocation) {
      try {
        currentLocation = await getCurrentLocation();
      } catch (error) {
        console.warn('Не удалось получить геолокацию для WhatsApp:', error);
      }
    }
    
    // Формируем сообщение с данными анкеты
    let message = '🎥 Новое видео!\n\n';
    
    if (formData) {
      message += `👨‍👩‍👧‍👦 Данные анкеты:\n`;
      message += `📝 Родитель: ${formData.parentName}\n`;
      message += `👶 Ребенок: ${formData.childName}\n`;
      message += `🎂 Возраст: ${formData.age}\n`;
      message += `📱 Телефон: ${formData.phone}\n`;
      if (formData.promoterName) {
        message += `🤝 Промоутер: ${formData.promoterName}\n`;
      }
      message += '\n';
    }
    
    if (currentLocation) {
      message += `📍 Местоположение:\n`;
      message += `🌍 Координаты: ${currentLocation.latitude}, ${currentLocation.longitude}\n`;
      if (currentLocation.address) {
        message += `🏠 Адрес: ${currentLocation.address}\n`;
      }
      message += '\n';
    }
    
    message += '💼 Отправлено через Империя Промо';
    
    const success = await shareVideoToWhatsApp(videoBlob, message);
    if (!success) {
      alert('Не удалось поделиться в WhatsApp. Видео будет скачано.');
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Icon name="Video" className="mr-2" size={20} />
          Видеозапись
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ display: isRecording || !videoURL ? 'block' : 'none' }}
            />
            {videoURL && !isRecording && (
              <video
                src={videoURL}
                controls
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          <div className="flex gap-2">
            {!isRecording && !videoURL && (
              <Button
                onClick={onStartRecording}
                className="flex-1"
              >
                <Icon name="Camera" className="mr-2" size={16} />
                Начать запись
              </Button>
            )}
            
            {isRecording && (
              <Button
                onClick={onStopRecording}
                variant="destructive"
                className="flex-1"
              >
                <Icon name="Square" className="mr-2" size={16} />
                Остановить
              </Button>
            )}
            
            {videoURL && !isRecording && (
              <>
                <Button
                  onClick={onRetakeVideo}
                  variant="outline"
                  className="flex-1"
                >
                  <Icon name="RotateCcw" className="mr-2" size={16} />
                  Пересъемка
                </Button>
                <Button
                  onClick={handleShareToWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!videoBlob}
                >
                  <Icon name="Send" className="mr-2" size={16} />
                  Отправить лид
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoRecorder;