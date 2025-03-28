import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CouchdbService } from '../../../services/couchdb.service';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css'],
})
export class ContactUsComponent {
  contactFormData: { name: string, email: string, message: string, submittedDate: Date | null } = {
    name: '',
    email: '',
    message: '',
    submittedDate: null // Initialize as null
  };
  formStatus: string | null = null;
  isSuccess: boolean = false;

  constructor(private readonly couchService: CouchdbService) {}

  // Handles form submission
  submitContactForm(): void {
    if (!this.isValidName(this.contactFormData.name) || !this.isValidEmail(this.contactFormData.email)) {
      this.formStatus = 'Please fix validation errors before submitting.';
      this.isSuccess = false;
      return;
    }

    // Set current timestamp before submission
    this.contactFormData.submittedDate = new Date();

    this.couchService.submitContactForm(this.contactFormData).subscribe({
      next: () => {
        this.formStatus = 'Thank you! Your message has been sent successfully ✅';
        this.isSuccess = true;
        this.resetForm();
      },
      error: () => {
        this.formStatus = 'Oops! Something went wrong. Please try again.';
        this.isSuccess = false;
      },
    });
  }

  // Validate Name (At least 3 characters, letters & spaces only)
  isValidName(name: string): boolean {
    return /^[A-Za-z\s]{3,}$/.test(name);
  }

  // Validate Email (Proper email format)
  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Reset form after successful submission
  private resetForm(): void {
    this.contactFormData = { name: '', email: '', message: '', submittedDate: null };
  }
}