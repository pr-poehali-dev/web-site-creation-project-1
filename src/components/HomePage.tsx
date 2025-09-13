import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface HomePageProps {
  onNewLead: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNewLead }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Империя Промо</h1>
          <p className="text-gray-600">Система управления лидами</p>
        </div>
        
        <Button 
          onClick={onNewLead}
          size="lg"
          className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Icon name="UserPlus" className="mr-2" size={20} />
          Новый лид
        </Button>
      </div>
    </div>
  );
};

export default HomePage;