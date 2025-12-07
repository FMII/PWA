import { TestBed } from '@angular/core/testing';

import { OfflineData } from './offline-data';

describe('OfflineData', () => {
  let service: OfflineData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfflineData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
