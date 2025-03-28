import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Digital Vault';
  currentuser: string | null = "";
  isMenuOpen = false;
  logoutDropdown = false;
  showLogoutModal = false;
  showNavWarningModal = false;
  pendingRoute: string | null = null;
  showNavbar: any;
  isScrolled=false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.router.url.includes('/user-dashboard')) {
      this.isScrolled = window.scrollY > 50;
    } else {
      this.isScrolled = false;
    }
  }

  constructor(private readonly router: Router) {}

  ngAfterContentChecked() {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.currentuser = localStorage.getItem('loggedUser');
    }
  }

  // Add this new method to check if current route is admin page
  isAdminPage(): boolean {
    return this.router.url.includes('/admin');
  }

  // Keep all your existing methods exactly the same
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleLogoutDropdown() {
    this.logoutDropdown = !this.logoutDropdown;
  }

  openLogoutDialog() {
    this.showLogoutModal = true;
  }

  closeLogoutDialog() {
    this.showLogoutModal = false;
  }

  logout() {
    localStorage.removeItem('loggedUser');
    this.currentuser = "";
    this.logoutDropdown = false;
    this.showLogoutModal = false;
    console.log("User Logged Out...");
    this.router.navigate(['/home']);
  }

  onNavClick(route: string) {
    if (this.currentuser) {
      this.showNavWarningModal = true;
      this.pendingRoute = route;
    } else {
      this.router.navigate([route]);
    }
  }

  confirmNavigation() {
    if (this.pendingRoute) {
      this.logout();
      this.router.navigate([this.pendingRoute]);
      this.showNavWarningModal = false;
      this.pendingRoute = null;
    }
  }

  cancelNavigation() {
    this.showNavWarningModal = false;
    this.pendingRoute = null;
  }

  isViewPage():boolean{
    return this.router.url.includes('/view')
  }
}