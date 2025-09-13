import type { FormData } from '@/components/LeadForm';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const useTelegram = () => {
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

  return {
    getCurrentLocation,
    sendToTelegram
  };
};