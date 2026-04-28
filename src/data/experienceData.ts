import type { ModalItemData } from '../components/ModalOverlay';

export interface WorkExperience {
  title: string;
  titleShort: string;
  company: string;
  companyUrl: string;
  logo: string;
  period: string;
  location: string;
  description: string;
  bullets: string[];
}

export interface Education {
  degree: string;
  degreeShort: string;
  institution: string;
  institutionShort: string;
  institutionUrl: string;
  facultyUrl: string;
  logo: string;
  period: string;
}

export const workExperience: WorkExperience[] = [
  {
    title: 'Desarrollador de Software (Práctica Profesional)',
    titleShort: 'Desarrollador (Práctica)',
    company: 'Inventario S.A.',
    companyUrl: 'https://www.inventario.design/',
    logo: '/img/inventario-logo.svg',
    period: 'Ene 2026 – Mar 2026',
    location: 'Panamá (Semirremoto)',
    description: 'Diseñé herramientas internas Full-Stack para optimizar la gestión de datos mediante procesos automatizados, priorizando seguridad y eficiencia.',
    bullets: [
      'Gestor de archivos privado con RBAC, JWT y Bcrypt (Next.js, Node.js, Prisma).',
      'Scripts en Python para clasificación masiva de registros y gestión de contactos.',
      'Interfaces adaptables de alto rendimiento con Astro y Tailwind CSS.'
    ]
  }
];

export const education: Education[] = [
  {
    degree: 'Licenciatura en Ingeniería en Informática',
    degreeShort: 'Ingeniería en Informática',
    institution: 'Universidad de Panamá - FIEC',
    institutionShort: 'UP - FIEC',
    institutionUrl: 'https://www.up.ac.pa/',
    facultyUrl: 'https://fiec.up.ac.pa/',
    logo: '/img/UP-logo.png',
    period: '2021 — Actualidad'
  }
];

export const projects: (ModalItemData | string)[] = [
  {
    title: 'Mi Portafolio Web',
    image: '/img/projects/Portfolio_GIF.gif',
    description: 'Plataforma personal interactiva diseñada para centralizar mi trayectoria, certificaciones y proyectos. Cuenta con un diseño premium enfocado en la experiencia de usuario, integrando un chatbot inteligente con IA para consultas dinámicas sobre mi perfil profesional.',
    url: 'https://github.com/Zobercito/portafolio',
    skills: ['Astro', 'React', 'Tailwind CSS', 'TypeScript', 'Cloudflare Workers', 'IA Integration']
  },
  '', '', '', '', '', '' // 6 Placeholders remaining
];

export const certificates: (ModalItemData | string)[] = [
  {
    title: 'Curso de Python e IA - Samsung Innovation Campus',
    image: '/certs/SIC_2023-Francisco_Gonzalez.jpg',
    description: 'Certificación de 280 horas de formación técnica avanzada en Python e Inteligencia Artificial. Mi formación se centró en el desarrollo de software full-stack, análisis estadístico y la creación de modelos de Machine Learning y Deep Learning para la resolución de problemas reales y de alto impacto.',
    skills: ['Python', 'Inteligencia Artificial', 'Machine Learning', 'Deep Learning', 'Análisis Estadístico', 'Desarrollo Full-stack']
  },
  {
    title: 'Curso Profesional de Python - Código Facilito',
    image: '/certs/CursoCodigoFacilito-FranciscoGonzalez.jpg',
    description: 'Completé este curso de Python donde aprendí desde los fundamentos hasta conceptos avanzados como decoradores, closures y Programación Orientada a Objetos. Me enfoqué especialmente en dominar listas, tuplas, diccionarios y en escribir funciones y clases limpias, lo que me equipa para desarrollar soluciones fullstack eficientes y escalables.',
    url: 'https://codigofacilito.com/certificates/06d3f966-da18-423f-9baa-46dc227ed710.pdf',
    skills: [
      'Python',
      'Programación Orientada a Objetos',
      'Decoradores',
      'Closures',
      'Colecciones de Datos',
      'Listas, Tuplas y Diccionarios'
    ]
  },
  '', '', '', '', '' // 5 Placeholders more for a total of 7
];

export const stackIcons = [
  { name: 'Python', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { name: 'JavaScript', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { name: 'TypeScript', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  { name: 'Astro', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/astro/astro-original.svg' },
  { name: 'React', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { name: 'HTML', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
  { name: 'CSS', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
  { name: 'Tailwind CSS', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg' },
  { name: 'Vite', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vite/vite-original.svg' },
  { name: 'Node.js', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
  { name: 'Docker', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { name: 'Prisma', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg' },
  { name: 'PostgreSQL', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { name: 'Git', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
  { name: 'GitHub', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' },
  { name: 'Linux', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg' },
  { name: 'Bash', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg' },
];
