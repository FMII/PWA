import { TestBed } from '@angular/core/testing';

import { Poll } from './polls';

describe('Poll', () => {
  let service: Poll;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Poll);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
