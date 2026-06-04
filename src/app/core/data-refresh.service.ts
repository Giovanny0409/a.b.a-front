import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DataRefreshService {
  private readonly revisionState = signal(0);

  readonly revision = this.revisionState.asReadonly();

  requestRefresh(): void {
    this.revisionState.update((revision) => revision + 1);
  }
}
