import { defineStore } from 'pinia';
import { computed, nextTick, ref } from 'vue';

export const APP_THEMES = ['dark', 'light', 'sakura', 'mint', 'ocean', 'sunset', 'system'] as const;
export type AppTheme = typeof APP_THEMES[number];

type EffectiveTheme = Exclude<AppTheme, 'system'>;
type ThemeTransition = {
  ready: Promise<void>;
};

type ThemeTransitionDocument = Document & {
  startViewTransition?: (callback: () => Promise<void> | void) => ThemeTransition;
};

const LOCAL_THEME_KEY = 'doro_theme';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';
const systemThemeMediaQuery =
  typeof window !== 'undefined' ? window.matchMedia(SYSTEM_THEME_QUERY) : null;
const THEME_CLASS_MAP: Record<EffectiveTheme, string | null> = {
  dark: null,
  light: 'light-theme',
  sakura: 'theme-sakura',
  mint: 'theme-mint',
  ocean: 'theme-ocean',
  sunset: 'theme-sunset',
};
const THEME_COLOR_SCHEME_MAP: Record<EffectiveTheme, 'dark' | 'light'> = {
  dark: 'dark',
  light: 'light',
  sakura: 'light',
  mint: 'light',
  ocean: 'dark',
  sunset: 'dark',
};

const isAppTheme = (value: string | null): value is AppTheme => {
  return !!value && APP_THEMES.includes(value as AppTheme);
};

const resolveEffectiveTheme = (theme: AppTheme): EffectiveTheme => {
  if (theme === 'system') {
    return systemThemeMediaQuery?.matches ? 'dark' : 'light';
  }

  return theme;
};

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<AppTheme>('dark');
  const effectiveTheme = computed<EffectiveTheme>(() => resolveEffectiveTheme(theme.value));

  const applyTheme = (nextTheme: AppTheme = theme.value) => {
    const resolvedTheme = resolveEffectiveTheme(nextTheme);
    const root = document.documentElement;
    const activeClassName = THEME_CLASS_MAP[resolvedTheme];

    Object.values(THEME_CLASS_MAP).forEach((className) => {
      if (className) {
        root.classList.remove(className);
      }
    });

    if (activeClassName) {
      root.classList.add(activeClassName);
    }

    root.style.colorScheme = THEME_COLOR_SCHEME_MAP[resolvedTheme];
  };

  const persistTheme = () => {
    try {
      localStorage.setItem(LOCAL_THEME_KEY, theme.value);
    } catch (_) {}
  };

  const initialize = () => {
    try {
      const savedTheme = localStorage.getItem(LOCAL_THEME_KEY);
      if (isAppTheme(savedTheme)) {
        theme.value = savedTheme;
      } else {
        persistTheme();
      }
    } catch (_) {}

    applyTheme();
  };

  const setTheme = (nextTheme: AppTheme) => {
    if (theme.value === nextTheme) {
      applyTheme(nextTheme);
      return;
    }

    theme.value = nextTheme;
    persistTheme();
    applyTheme(nextTheme);
  };

  const setThemeWithTransition = async (nextTheme: AppTheme, event?: MouseEvent) => {
    if (theme.value === nextTheme) {
      return;
    }

    const transitionDocument = document as ThemeTransitionDocument;
    if (!transitionDocument.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    try {
      const transition = transitionDocument.startViewTransition(async () => {
        setTheme(nextTheme);
        await nextTick();
      });

      await transition.ready;

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    } catch (_) {
      setTheme(nextTheme);
    }
  };

  systemThemeMediaQuery?.addEventListener('change', () => {
    if (theme.value === 'system') {
      applyTheme('system');
    }
  });

  return {
    theme,
    effectiveTheme,
    initialize,
    setTheme,
    setThemeWithTransition,
  };
});
