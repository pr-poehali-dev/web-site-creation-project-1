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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { max: 640 },
          height: { max: 360 }
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8'
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
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
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('video', videoBlob, 'lead_video.webm');
      formDataToSend.append('parent_name', formData.parentName);
      formDataToSend.append('child_name', formData.childName);
      formDataToSend.append('age', formData.age);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('promoter_name', formData.promoterName);

      // Имитация отправки в Telegram
      // В реальном проекте здесь будет запрос к Telegram Bot API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentStep('success');
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Ошибка при отправке данных');
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
              <p className="text-gray-600">Лид успешно отправлен</p>
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
                Отправка...
              </>
            ) : (
              <>
                <Icon name="Send" className="mr-2" size={16} />
                Отправить лид
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;