import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { FormsModule } from '@angular/forms';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { BroadcastChannel } from 'worker_threads';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
   AdminDashboardComponent
  ],
  imports: [
    AdminRoutingModule,
    FormsModule,
    CommonModule,
    BrowserAnimationsModule,
    NgxChartsModule,
    RouterModule
  ],
  exports: [
    AdminRoutingModule,
    AdminDashboardComponent
  ]
})
export class AdminModule { }
