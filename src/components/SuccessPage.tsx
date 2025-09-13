import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface SuccessPageProps {
  onCreateNewLead: () => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ onCreateNewLead }) => {
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
            onClick={onCreateNewLead}
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
};

export default SuccessPage;