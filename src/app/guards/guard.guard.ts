import { CanActivateFn } from '@angular/router';

function getSubPath(url: string, prefixes: string[]): string {
  for (const prefix of prefixes) {
    const regex = new RegExp(`^\\/${prefix}(\\/|$)`);
    if (regex.test(url)) {
      const remaining = url.replace(regex, '');
      return remaining ? remaining : '';
    }
  }
  return '';
}

export const developmentGuard: CanActivateFn = (route, state) => {
  const sub = getSubPath(state.url, ['development', 'dev']);
  window.location.href = "/CheemsBonkGame/dev/" + sub;
  return false;
};

export const devGuard: CanActivateFn = (route, state) => {
  const sub = getSubPath(state.url, ['dev', 'development']);
  window.location.href = "/CheemsBonkGame/dev/" + sub;
  return false;
};

export const testingGuard: CanActivateFn = (route, state) => {
  const sub = getSubPath(state.url, ['test']);
  window.location.href = "/CheemsBonkGame/test/" + sub;
  return false;
};

export const appGuard: CanActivateFn = (route, state) => {
  const sub = getSubPath(state.url, ['app']);
  window.location.href = "/CheemsBonkGame/app/" + sub;
  return false;
};

