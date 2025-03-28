import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [LandingPageComponent],
  imports: [CommonModule, RouterModule],
  exports: [LandingPageComponent],
})
export class SharedModule {}
