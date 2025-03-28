import { Component } from '@angular/core';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.css'
})
export class PrivacyPolicyComponent {

   // Component properties
   lastUpdatedDate = '2023-11-15';
   currentVersion = '1.0';
 
   // Method to print the policy
   printPolicy(): void {
     window.print();
   }

}
