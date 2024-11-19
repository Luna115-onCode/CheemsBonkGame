import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnworkPageComponent } from './onwork-page.component';

describe('OnworkPageComponent', () => {
  let component: OnworkPageComponent;
  let fixture: ComponentFixture<OnworkPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnworkPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnworkPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
