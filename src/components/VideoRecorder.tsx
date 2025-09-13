import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface VideoRecorderProps {
  isRecording: boolean;
  videoURL: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRetakeVideo: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  isRecording,
  videoURL,
  onStartRecording,
  onStopRecording,
  onRetakeVideo,
  videoRef
}) => {
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
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoRecorder;