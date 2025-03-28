import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrivacyPolicyComponent } from './privacy-policy.component';

describe('PrivacyPolicyComponent', () => {
  let component: PrivacyPolicyComponent;
  let fixture: ComponentFixture<PrivacyPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrivacyPolicyComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivacyPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display current version', () => {
    const versionElement = fixture.nativeElement.querySelector('.version-info p:first-child');
    expect(versionElement.textContent).toContain(component.currentVersion);
  });

  it('should call print method when button clicked', () => {
    spyOn(window, 'print');
    const button = fixture.nativeElement.querySelector('.print-button');
    button.click();
    expect(window.print).toHaveBeenCalled();
  });
});