import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface FormData {
  parentName: string;
  childName: string;
  age: string;
  phone: string;
  promoterName: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'home' | 'form' | 'success'>('home');
  const [formData, setFormData] = useState<FormData>({
    parentName: '',
    childName: '',
    age: '',
    phone: '',
    promoterName: ''
  });
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Геолокация не поддерживается браузером'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMessage = 'Ошибка получения геолокации';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Доступ к геолокации запрещен';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Информация о местоположении недоступна';
              break;
            case error.TIMEOUT:
              errorMessage = 'Превышено время ожидания геолокации';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  const sendToTelegram = async (formData: FormData, videoBlob: Blob, location: LocationData | null) => {
    const BOT_TOKEN = '8286818285:AAGqkSsTlsbKCT1guKYoDpkL_OcldAVyuSE';
    const CHAT_ID = '5215501225';
    const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

    console.log('Начинаю отправку в Telegram...');
    console.log('Размер видео:', (videoBlob.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Тип видео:', videoBlob.type);

    try {
      // Отправляем текстовое сообщение с данными анкеты
      const messageText = `🎯 Новый лид от Империя Промо\n\n` +
        `👤 Родитель: ${formData.parentName}\n` +
        `👶 Ребенок: ${formData.childName}\n` +
        `🎂 Возраст: ${formData.age}\n` +
        `📞 Телефон: ${formData.phone}\n` +
        `🎪 Промоутер: ${formData.promoterName}\n\n` +
        (location ? 
          `📍 Локация: https://maps.google.com/maps?q=${location.latitude},${location.longitude}\n` +
          `🎯 Точность: ${Math.round(location.accuracy)} метров` 
          : '📍 Локация: Не определена');

      console.log('Отправляю текстовое сообщение...');
      const messageResponse = await fetch(`${BASE_URL}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: messageText
        })
      });

      if (!messageResponse.ok) {
        const errorText = await messageResponse.text();
        console.error('Ошибка отправки сообщения:', errorText);
        throw new Error(`Ошибка отправки сообщения: ${messageResponse.status}`);
      }

      // Проверяем размер файла (Telegram ограничивает до 50MB для документов)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (videoBlob.size > maxSize) {
        throw new Error(`Файл слишком большой: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB. Максимум: 50MB`);
      }

      console.log('Отправляю видео...');
      
      // Пробуем отправить как видео сначала
      const videoFormData = new FormData();
      videoFormData.append('chat_id', CHAT_ID);
      videoFormData.append('video', videoBlob, `lead_video_${Date.now()}.mp4`);
      videoFormData.append('caption', `🎥 Видео от ${formData.parentName}`);
      videoFormData.append('width', '640');
      videoFormData.append('height', '360');
      videoFormData.append('duration', '30');

      const videoResponse = await fetch(`${BASE_URL}/sendVideo`, {
        method: 'POST',
        body: videoFormData
      });
      
      if (!videoResponse.ok) {
        console.log('Не удалось отправить как видео, пробую как документ...');
        
        // Если не получилось как видео, пробуем как документ
        const docFormData = new FormData();
        docFormData.append('chat_id', CHAT_ID);
        docFormData.append('document', videoBlob, `lead_video_${Date.now()}.webm`);
        docFormData.append('caption', `🎥 Видео от ${formData.parentName} (как документ)`);

        const docResponse = await fetch(`${BASE_URL}/sendDocument`, {
          method: 'POST',
          body: docFormData
        });
        
        if (!docResponse.ok) {
          const docErrorText = await docResponse.text();
          console.error('Ошибка отправки документа:', docErrorText);
          
          // Если и документ не отправился, отправляем только информацию о том, что видео было записано
          const fallbackFormData = new FormData();
          fallbackFormData.append('chat_id', CHAT_ID);
          fallbackFormData.append('text', `❌ Не удалось отправить видео от ${formData.parentName}\n\n📊 Размер: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB\n📱 Тип: ${videoBlob.type}\n\n⚠️ Видео записано, но превышен лимит отправки`);
          
          await fetch(`${BASE_URL}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: CHAT_ID,
              text: `❌ Не удалось отправить видео от ${formData.parentName}\n\n📊 Размер: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB\n📱 Тип: ${videoBlob.type}\n\n⚠️ Видео записано, но превышен лимит отправки`
            })
          });
          
          console.warn('Видео не отправлено, но уведомление отправлено');
        } else {
          console.log('Видео успешно отправлено как документ');
        }
      } else {
        console.log('Видео успешно отправлено');
      }

      // Отправляем геолокацию как отдельное сообщение, если доступна
      if (location) {
        await fetch(`${BASE_URL}/sendLocation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            latitude: location.latitude,
            longitude: location.longitude
          })
        });
      }

    } catch (error) {
      console.error('Ошибка отправки в Telegram:', error);
      throw error;
    }
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640, max: 640 },
          height: { ideal: 360, max: 360 },
          frameRate: { ideal: 15, max: 20 }
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      let options = {};
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        options = { 
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: 1000000 // 1 Mbps для уменьшения размера
        };
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { 
          mimeType: 'video/webm',
          videoBitsPerSecond: 1000000
        };
      } else {
        options = { videoBitsPerSecond: 1000000 };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const mimeType = (options as any).mimeType || 'video/webm';
        const blob = new Blob(chunks, { type: mimeType });
        console.log('Видео записано:', blob.size, 'bytes, тип:', blob.type);
        setVideoBlob(blob);
        setVideoURL(URL.createObjectURL(blob));
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      alert('Не удалось получить доступ к камере');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retakeVideo = () => {
    setVideoBlob(null);
    setVideoURL('');
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
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

  const resetForm = () => {
    setCurrentStep('home');
    setFormData({
      parentName: '',
      childName: '',
      age: '',
      phone: '',
      promoterName: ''
    });
    setVideoBlob(null);
    setVideoURL('');
    setLocation(null);
    setLocationError('');
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
  };

  if (currentStep === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Империя Промо</h1>
            <p className="text-gray-600">Система управления лидами</p>
          </div>
          
          <Button 
            onClick={() => setCurrentStep('form')}
            size="lg"
            className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Icon name="UserPlus" className="mr-2" size={20} />
            Новый лид
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Check" className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Успешно!</h2>
              <p className="text-gray-600">Лид успешно отправлен в Telegram</p>
            </div>
            
            <Button 
              onClick={resetForm}
              className="w-full"
              size="lg"
            >
              <Icon name="Plus" className="mr-2" size={20} />
              Создать новый лид
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="FileText" className="mr-2" size={20} />
                Анкета
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="parentName">Имя родителя</Label>
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) => handleInputChange('parentName', e.target.value)}
                  placeholder="Введите имя родителя"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="childName">Имя ребенка</Label>
                <Input
                  id="childName"
                  value={formData.childName}
                  onChange={(e) => handleInputChange('childName', e.target.value)}
                  placeholder="Введите имя ребенка"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="age">Возраст</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Введите возраст"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="promoterName">Имя промоутера</Label>
                <Input
                  id="promoterName"
                  value={formData.promoterName}
                  onChange={(e) => handleInputChange('promoterName', e.target.value)}
                  placeholder="Введите имя промоутера"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Видеозапись */}
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
                      onClick={startVideoRecording}
                      className="flex-1"
                    >
                      <Icon name="Camera" className="mr-2" size={16} />
                      Начать запись
                    </Button>
                  )}
                  
                  {isRecording && (
                    <Button
                      onClick={stopRecording}
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
                        onClick={retakeVideo}
                        variant="outline"
                        className="flex-1"
                      >
                        <Icon name="RotateCcw" className="mr-2" size={16} />
                        Пересъемка
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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

        {/* Кнопка отправки */}
        <div className="mt-6 text-center">
          <Button
            onClick={submitData}
            disabled={!videoURL || !formData.parentName || !formData.childName || !formData.phone || isSubmitting}
            size="lg"
            className="w-full max-w-md"
          >
            {isSubmitting ? (
              <>
                <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
                Отправка в Telegram...
              </>
            ) : (
              <>
                <Icon name="Send" className="mr-2" size={16} />
                Отправить лид
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            При отправке будет определена ваша геолокация
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;