// Утилиты для работы с WhatsApp

export const detectDevice = () => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid;
  
  return { isIOS, isAndroid, isMobile };
};

export const shareVideoToWhatsApp = async (videoBlob: Blob, message?: string) => {
  const { isIOS, isAndroid, isMobile } = detectDevice();
  
  try {
    // Определяем правильное расширение файла на основе типа
    const fileExtension = videoBlob.type.includes('mp4') ? '.mp4' : '.webm';
    const fileName = `video${fileExtension}`;
    
    // Проверяем поддержку Web Share API с файлами
    if (navigator.share && navigator.canShare) {
      const file = new File([videoBlob], fileName, { type: videoBlob.type });
      
      const shareData: ShareData = {
        files: [file],
        title: 'Видео с нашего сайта',
        text: message || 'Поделиться видео'
      };
      
      // Проверяем, может ли браузер поделиться этими данными
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      }
    }
    
    // Fallback: попытка через URL схемы WhatsApp
    if (isMobile) {
      // Создаем временную ссылку для скачивания видео с правильным расширением
      const videoURL = URL.createObjectURL(videoBlob);
      const link = document.createElement('a');
      link.href = videoURL;
      link.download = fileName;
      link.click();
      
      // После скачивания открываем WhatsApp
      setTimeout(() => {
        const whatsappMessage = encodeURIComponent(message || 'Смотри, какое видео я записал!');
        const whatsappURL = isIOS 
          ? `whatsapp://send?text=${whatsappMessage}`
          : `https://api.whatsapp.com/send?text=${whatsappMessage}`;
        
        window.open(whatsappURL, '_blank');
        URL.revokeObjectURL(videoURL);
      }, 1000);
      
      return true;
    }
    
    // Для десктопа - просто скачиваем видео с правильным расширением
    const videoURL = URL.createObjectURL(videoBlob);
    const link = document.createElement('a');
    link.href = videoURL;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(videoURL);
    
    return false;
  } catch (error) {
    console.error('Ошибка при отправке в WhatsApp:', error);
    return false;
  }
};

export const openWhatsAppChat = (phoneNumber?: string, message?: string) => {
  const { isIOS } = detectDevice();
  const encodedMessage = encodeURIComponent(message || '');
  
  let whatsappURL: string;
  
  if (phoneNumber) {
    // Убираем все символы кроме цифр
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    whatsappURL = isIOS 
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`
      : `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
  } else {
    whatsappURL = isIOS 
      ? `whatsapp://send?text=${encodedMessage}`
      : `https://api.whatsapp.com/send?text=${encodedMessage}`;
  }
  
  window.open(whatsappURL, '_blank');
};