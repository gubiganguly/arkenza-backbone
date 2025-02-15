import { ReactNode } from 'react';

export interface DeviceSetting {
  label: string;
  enabled: boolean;
}

export interface SettingColumns {
  column1: DeviceSetting[];
  column2: DeviceSetting[];
}

export interface Tool {
  icon: ReactNode;
  label: string;
  description: string;
}

export interface SlideContent {
  title: string;
  content: string;
  icon?: ReactNode;
}

export interface Slide {
  id: number;
  title: string;
  content: string;
  icon?: ReactNode;
}

export interface FinalSlide {
  title: string;
  description: string;
  duration: string;
  deviceSettings: SettingColumns[];
  tools: Tool[];
}

export interface ModuleContent {
  id: string;
  title: string;
  slides: Slide[];
}

export interface SlideDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideContent[];
  finalSlide: FinalSlide;
  onFinish?: () => void;
}

