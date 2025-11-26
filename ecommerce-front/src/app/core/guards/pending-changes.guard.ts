import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const pendingChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component?.hasUnsavedChanges) {
    return true;
  }

  return !component.hasUnsavedChanges() || confirm('Tienes cambios sin guardar. ¿Deseas salir igualmente?');
};

