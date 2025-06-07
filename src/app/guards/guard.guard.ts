import { CanActivateFn } from '@angular/router';

export const developmentGuard: CanActivateFn = (route, state) => {
  window.location.href = "/CheemsBonkGame/development";
  return false;
};

export const testingGuard: CanActivateFn = (route, state) => {
  window.location.href = "/CheemsBonkGame/test";
  return false;
};
