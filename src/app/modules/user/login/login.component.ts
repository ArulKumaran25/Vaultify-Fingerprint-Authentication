import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CouchdbService } from '../../../services/couchdb.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import confetti from 'canvas-confetti';
import { FingerprintService } from '../../../services/fingerprint.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  welcomeMessage: string = '';
  showPopup: boolean = false;
  popupMessage: string = '';
  isAdmin: boolean = false;

  readonly adminEmail: string = 'admin123@gmail.com';
  readonly adminPassword: string = 'Admin@123';

  constructor(
    readonly couchService: CouchdbService,
    readonly fingerprintService: FingerprintService,
    readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  handleSuccessfulLogin(userEmail: string, isAdmin: boolean = false) {
    this.isAdmin = isAdmin;
    this.popupMessage = isAdmin 
      ? 'Admin logged in successfully!' 
      : 'Logged in successfully!';
    
    this.showPopup = true;
    this.triggerFireworks();

    // Set timeout for automatic navigation after showing popup
    setTimeout(() => {
      this.closePopup();
    }, 3000);

    if (isAdmin) {
      if (typeof window !== 'undefined') {
        localStorage.setItem("loggedUser", "Admin");
        localStorage.setItem("userId", this.adminEmail);
      }
      return;
    }

    // Handle regular user login
    this.couchService.getAllRegisteredUser().subscribe((users: any) => {
      users.rows.forEach((e: any) => {
        if (e.value.email === userEmail) {
          this.couchService.currentUser = e.value.name;
          if (typeof window !== 'undefined') {
            localStorage.setItem("loggedUser", e.value.name);
            localStorage.setItem("userId", e.value.email);
            localStorage.setItem("userRevId", e.value._rev);
            localStorage.setItem("userDocumentId", e.value.email + '_documents');
          }

          const activityLog = {
            userId: e.value.email,
            type: "activitylogs",
            timestamp: new Date().toISOString()
          };
          this.couchService.logUserActivity(activityLog).subscribe({
            next: () => console.log("User login activity logged successfully."),
            error: (err) => console.error("Error logging activity:", err)
          });
        }
      });
    });
  }

  loginWithEmailPassword() {
    // Check for admin login first
    if (this.email === this.adminEmail && this.password === this.adminPassword) {
      this.handleSuccessfulLogin(this.email, true);
      return;
    }

    // Check for regular user login
    this.couchService.getAllRegisteredUser().subscribe((users: any) => {
      const user = users.rows.find((u: any) => 
        u.value.email === this.email && 
        u.value.password === this.password && 
        u.value.type === 'registerdetails'  
      );

      if (user) {
        this.handleSuccessfulLogin(this.email);
      } else {
        this.errorMessage = 'Invalid email or password';
        this.snackBar.open('Invalid credentials', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  triggerFireworks(duration: number = 500) {
    const end = Date.now() + duration;
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      
      // Big center blast
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.6 },
        startVelocity: 30
      });

      // Side blasts
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 }
      });
    }, 200);
  }

  closePopup() {
    this.showPopup = false;
    if (this.isAdmin) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/user/dashboard']);
    }
  }

  authenticateWithFingerPrint() {
    if (!this.email) {
      this.snackBar.open('Please enter email', 'Close', {
        duration: 3000,
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    this.fingerprintService.authenticateFingerprint(this.email).subscribe(
      response => {
        const isAdmin = this.email === this.adminEmail;
        this.handleSuccessfulLogin(this.email, isAdmin);
      },
      error => {
        this.snackBar.open('Fingerprint not found', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    );
  }
}