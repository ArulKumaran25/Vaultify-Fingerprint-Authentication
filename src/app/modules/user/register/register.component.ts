import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CouchdbService } from '../../../services/couchdb.service';
import { HttpClient } from '@angular/common/http';
import { FingerprintService } from '../../../services/fingerprint.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  encryptedFingerprint : string = "";
  errorMessage: string = '';
  emailExists: boolean = false;
  showPopup: boolean = false;
  popupMessage: string = ''; // Add this line to store pop-up messages

  acceptedPrivacy:boolean=false;

  // Regular expressions for validations
  emailPattern: RegExp = /^[a-z][a-z0-9._%+-]{5,}@[a-z0-9.-]+\.[a-z]{2,}$/; 
  passwordPattern: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/; 

  constructor(private readonly couchService: CouchdbService, private readonly router: Router, private readonly http: HttpClient, private readonly fingerprintService: FingerprintService) {}

  // Check if passwords match
  passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  // Validate if email is in a valid format
  isEmailValid(): boolean {
    return this.emailPattern.test(this.email);
  }

  // Validate if the password is strong
  isPasswordStrong(): boolean {
    return this.passwordPattern.test(this.password);
  }

  // Register user
  register() {
    this.emailExists = false;
    if (this.name && this.email && this.password && this.confirmPassword) {
      if (!this.isEmailValid()) {
        this.errorMessage = 'Invalid email format. Ensure it contains no uppercase letters.';
        return;
      }
      if (!this.passwordsMatch()) {
        this.errorMessage = 'Passwords do not match.';
        return;
      }
      if (!this.isPasswordStrong()) {
        this.errorMessage = 'Password must be at least 6 characters long, include one uppercase letter, one lowercase letter, one number, and one special character.';
        return;
      }
      if(!this.encryptedFingerprint){
        this.errorMessage = 'No fingerPrint data found';
        return;
      }
      const userData = {
        name: this.name,
        email: this.email,
        password: this.password,
        type: "registerdetails",
        encryptedFingerprint : this.encryptedFingerprint
      };
      this.findEmailUniqueness(userData); 
    } else {
      this.errorMessage = 'Please fill in all fields.';
    }
  }

  findEmailUniqueness(userData: any) {
    this.couchService.getAllRegisteredUser().subscribe({
      next: (response) => {
        response.rows.forEach((e: any) => {
          if (e.value.email === this.email)
            this.emailExists = true;
        });
        if (this.emailExists) {
          this.popupMessage = 'Email already exists. Please use a different email.'; // Set pop-up message
          this.showPopup = true; // Show pop-up
          return;
        } else {
          this.couchService.addData(userData).subscribe({
            next: () => {
              this.popupMessage = 'Registration Successful!'; // Set pop-up message
              this.showPopup = true; // Show pop-up
              setTimeout(() => {
                this.closePopup();
                this.router.navigate(['/user/login']);
              }, 2000); // Auto-close after 2 seconds
              this.clearForm();
            },
            error: () => {
              this.errorMessage = 'Registration Failed.';
            }
          });
        }
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  closePopup() {
    this.showPopup = false;
  }

  clearForm() {
    this.name = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.errorMessage = '';
  }

  registerWithFingerprint() {
    this.fingerprintService.registerFingerprint(123).subscribe(
      (response : any) => {alert('Fingerprint registered successfully!');
        console.log(response)
        this.encryptedFingerprint = response.encryptedImage
      },
      (error : any) => alert('Error registering fingerprint: ' + error.message)
    );
  }
}