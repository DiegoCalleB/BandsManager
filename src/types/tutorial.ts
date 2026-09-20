export interface TutorialKeyPoint {
 title: string;
 desc: string;
}

export type TutorialUiTargetType = 'button' | 'tab' | 'section' | 'input' | 'menu';

export interface TutorialUiTarget {
 type: TutorialUiTargetType;
 label: string; // Nombre del botón o sección (ej. 'Botón "Ver EPK Público"')
 location: string; // Ubicación en pantalla (ej. 'Cabecera superior · Esquina derecha')
 actionHint: string; // Qué hace o para qué sirve (ej. 'Abre el enlace que debes enviar al promotor')
 selector?: string; // Selector CSS para enfocar y resaltar el elemento en pantalla
}

export interface TutorialStep {
 id: string;
 stepNumber: number;
 badge: string;
 title: string;
 musicianHook: string;
 description: string;
 iconName: 'BookOpen' | 'Music' | 'QrCode' | 'Calendar' | 'Disc' | 'FileText' | 'Sliders' | 'Sparkles' | 'Share2' | 'Mic' | 'Users' | 'Smartphone' | 'Radio' | 'Layers' | 'Zap' | 'Printer';
 uiTarget: TutorialUiTarget;
 keyPoints: TutorialKeyPoint[];
}

export type ModuleTutorialId = 'epk' | 'fans' | 'calendario' | 'repertorio' | 'song_studio' | 'booking';

export interface ModuleTutorialConfig {
 id: ModuleTutorialId;
 name: string;
 badge: string;
 subtitle: string;
 accent: 'purple' | 'amber' | 'blue' | 'emerald' | 'rose';
 steps: TutorialStep[];
}
