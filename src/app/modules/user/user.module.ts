import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AppModule } from '../../app.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FeaturesComponent } from './features/features.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ViewComponent } from './view/view.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';



@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    FeaturesComponent,
    ContactUsComponent,
    ViewComponent,
    PrivacyPolicyComponent,
    
  ],
  imports: [
    FormsModule,
    CommonModule,
    UserRoutingModule,
    MatSnackBarModule,
    NgxExtendedPdfViewerModule,
    PdfViewerModule
  
    
  ],
  exports:[
    UserRoutingModule
  ]
})
export class UserModule { }
