import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  constructor(readonly router: Router) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("loggedUser");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRevId");
      localStorage.removeItem("userDocumentId");
    }
  }

  navigateToLogin() {
    this.router.navigate(['/user/login']); //Navigates to the Login page
  }
}
