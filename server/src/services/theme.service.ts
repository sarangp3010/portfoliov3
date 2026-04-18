import { prisma } from '../config/prisma.js';

export const getTheme = async () => {
  let theme = await prisma.themeSetting.findUnique({ where: { id: 'default' } });
  if (!theme) {
    theme = await prisma.themeSetting.create({
      data: {
        id: 'default', mode: 'dark', primaryColor: '#6366f1', accentColor: '#8b5cf6',
        fontSans: 'Plus Jakarta Sans', fontMono: 'JetBrains Mono', fontDisplay: 'Syne',
        borderRadius: 'rounded', animationSpeed: 'normal', updatedAt: new Date(),
      },
    });
  }
  return theme;
};

export const updateTheme = async (data: Partial<{
  mode: string; primaryColor: string; accentColor: string;
  fontSans: string; fontMono: string; fontDisplay: string;
  borderRadius: string; animationSpeed: string; customCss: string;
}>) => {
  return prisma.themeSetting.upsert({
    where:  { id: 'default' },
    create: {
      id: 'default', mode: 'dark', primaryColor: '#6366f1', accentColor: '#8b5cf6',
      fontSans: 'Plus Jakarta Sans', fontMono: 'JetBrains Mono', fontDisplay: 'Syne',
      borderRadius: 'rounded', animationSpeed: 'normal', updatedAt: new Date(),
      ...data,
    },
    update: { ...data, updatedAt: new Date() },
  });
};
