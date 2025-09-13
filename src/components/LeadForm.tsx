import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export interface FormData {
  parentName: string;
  childName: string;
  age: string;
  phone: string;
  promoterName: string;
}

interface LeadFormProps {
  formData: FormData;
  onInputChange: (field: keyof FormData, value: string) => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ formData, onInputChange }) => {
  return (
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
            onChange={(e) => onInputChange('parentName', e.target.value)}
            placeholder="Введите имя родителя"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="childName">Имя ребенка</Label>
          <Input
            id="childName"
            value={formData.childName}
            onChange={(e) => onInputChange('childName', e.target.value)}
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
            onChange={(e) => onInputChange('age', e.target.value)}
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
            onChange={(e) => onInputChange('phone', e.target.value)}
            placeholder="+7 (999) 123-45-67"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="promoterName">Имя промоутера</Label>
          <Input
            id="promoterName"
            value={formData.promoterName}
            onChange={(e) => onInputChange('promoterName', e.target.value)}
            placeholder="Введите имя промоутера"
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadForm;