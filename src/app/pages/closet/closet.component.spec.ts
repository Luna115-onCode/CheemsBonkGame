import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosetComponent } from './closet.component';

describe('ClosetComponent', () => {
  let component: ClosetComponent;
  let fixture: ComponentFixture<ClosetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClosetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClosetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
