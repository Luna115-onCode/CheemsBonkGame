import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevSettingsComponent } from './dev-settings.component';

describe('DevSettingsComponent', () => {
  let component: DevSettingsComponent;
  let fixture: ComponentFixture<DevSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
