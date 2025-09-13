import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { FormData } from './LeadForm';
import type { LocationData } from '@/hooks/useTelegram';

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
  videoRef
}) => {
  const handleShareToWhatsApp = async () => {
    if (!videoBlob) return;
    
    const success = await shareVideoToWhatsApp(videoBlob, 'Посмотри мое видео!');
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
                  <Icon name="MessageCircle" className="mr-2" size={16} />
                  WhatsApp
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