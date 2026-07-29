import { CanActivateFn } from '@angular/router';

export const developmentGuard: CanActivateFn = (route, state) => {
  window.location.href = "/CheemsBonkGame/dev/";
  return false;
};

export const devGuard: CanActivateFn = (route, state) => {
  window.location.href = "/CheemsBonkGame/dev/";
  return false;
};

export const testingGuard: CanActivateFn = (route, state) => {
  window.location.href = "/CheemsBonkGame/test/";
  return false;
};

export const appGuard: CanActivateFn = (route, state) => {
  window.location.href = "/CheemsBonkGame/app/";
  return false;
};
