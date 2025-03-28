import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './modules/shared/landing-page/landing-page.component';
import { LoginComponent } from './modules/user/login/login.component';
import { RegisterComponent } from './modules/user/register/register.component';
import { AdminDashboardComponent } from './modules/admin/admin-dashboard/admin-dashboard.component';
import { DashboardComponent } from './modules/user/dashboard/dashboard.component';
import { FeaturesComponent } from './modules/user/features/features.component';
import { ContactUsComponent } from './modules/user/contact-us/contact-us.component';
import { ViewComponent } from './modules/user/view/view.component';
import { PrivacyPolicyComponent } from './modules/user/privacy-policy/privacy-policy.component'; 

const routes: Routes = [
  { path: '', component: LandingPageComponent }, // Landing Page
  { path: 'home', component: LandingPageComponent },
  { path: 'features', component: FeaturesComponent },
  { path: 'user/login', component: LoginComponent },
  { path: 'user/register', component: RegisterComponent },
  {path: 'user/dashboard',component:DashboardComponent},
  {path:'user/view/:fileId',component:ViewComponent},
  { path: 'contact-us', component: ContactUsComponent },
  { path: 'admin/dashboard', component: AdminDashboardComponent },
  { path: 'user/privacy-policy', component: PrivacyPolicyComponent },
  { path: '**', component: LandingPageComponent } // Fallback route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
