import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent {
  features = [
    { title: "Fingerprint Authentication", description: "Secure login using fingerprint verification.", icon: "🔒", moreInfo: "Your fingerprint ensures only you can access your files.",image: "assets/fingerprint.jpg", flipped: false },
    { title: "Search & Filter", description: "Find files easily by name, date, or type.", icon: "🔍", moreInfo: "Advanced search algorithms help you find files instantly.",image: "assets/search and filter.jpg",flipped: false },
    { title: "File Encryption & Decryption", description: "Secure your files with strong encryption.", icon: "🔐", moreInfo: "AES-256 encryption protects your sensitive data.",image: "assets/encryption and decryption.jpg",  flipped: false },
    { title: "File Backup & Restore", description: "Recover files within a specific timeframe.", icon: "🔄", moreInfo: "Restore deleted files within 7 days of deletion.",image: "assets/restore.jpg",  flipped: false },
    { title: "Activity Logs", description: "Track user activity & file changes.", icon: "📜", moreInfo: "Monitor changes and access history of your files.",image: "assets/activitylogs.jpg",flipped: false },
    { title: "Real-Time Feedback", description: "Get instant feedback on authentication & uploads.", icon: "📢", moreInfo: "Notifications for successful logins, uploads, and errors.",image: "assets/feedbacks.jpg", flipped: false }
  ];

  searchQuery: string = '';
  constructor(private readonly router:Router){}

  filterFeatures() {
    return this.features.filter(feature =>
      feature.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  toggleFlip(feature: any) {
    feature.flipped = !feature.flipped;
  }

  navigateToLogin(event:Event):void{
    event.stopPropagation();
    this.router.navigate(['user/login']);
  }
}
