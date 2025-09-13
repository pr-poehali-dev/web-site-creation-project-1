import { useState, useRef } from 'react';

export const useVideoRecorder = () => {
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const resetVideo = () => {
    setVideoBlob(null);
    setVideoURL('');
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
  };

  return {
    videoBlob,
    isRecording,
    videoURL,
    videoRef,
    startVideoRecording,
    stopRecording,
    retakeVideo,
    resetVideo
  };
};