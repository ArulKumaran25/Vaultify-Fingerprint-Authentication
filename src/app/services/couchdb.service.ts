import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class CouchdbService {
  readonly baseUrl = 'https://192.168.57.185:5984/digital-vault'; // CouchDB URL
  readonly username = 'd_couchdb'; // CouchDB Username
  readonly password = 'Welcome#2'; // CouchDB Password

  key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  currentUser: string = ''; // User name in the dashboard

  private readonly secretKey = this.key;
  credentials: any;
  headers: HttpHeaders | { [header: string]: string | string[]; } | undefined;
  constructor(private readonly http: HttpClient) {}

  private getHeaders() {
    return new HttpHeaders({
      Authorization: 'Basic ' + btoa(`${this.username}:${this.password}`),
      'Content-Type': 'application/json',
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  // Check if an email already exists
  checkEmailExists(email: string): Observable<boolean> {
    return this.http
      .get<any>(`${this.baseUrl}/_design/user/_view/user?key="${email}"`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.rows.length > 0),
        catchError(this.handleError)
      );
  }

  // Add a new user only if email is unique
  addData(data: any): Observable<any> {
    const docId = `user_2_${uuidv4()}`;
    // Add a timestamp and type to the data
    const timestamp = new Date().toISOString();
    data = { ...data, type: 'registerdetails', timestamp }; // Use 'registerdetails' as the type
    // Send the request to CouchDB
    return this.http.put(`${this.baseUrl}/${docId}`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Get all registered users (optional)
  getAllRegisteredUser(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/_design/views/_view/users`, {
      headers: this.getHeaders(),
    }).pipe(catchError(this.handleError));
  }

  // Login user
  getData(): Observable<any> {
    const docId = `user_2_${uuidv4()}`;
    const data = { type: 'user' };
    return this.http.put(`${this.baseUrl}/${docId}`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Fetch login counts per user
getLoginCountsPerUser(): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/_design/views/_view/loginCountsPerUser`, {
    headers: this.getHeaders(),
  }).pipe(catchError(this.handleError));
}

  // Contact forms
  submitContactForm(data: any): Observable<any> {
    const timestamp = new Date().toISOString();
    data = { ...data, type: 'contact', timestamp }; // Add type and ensure submittedDate is included
    const docId = `contact_2_${uuidv4()}`;
    return this.http.put(`${this.baseUrl}/${docId}`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Get all contact form submissions
  fetchContactForms(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/_design/views/_view/contact_forms`, {
      headers: this.getHeaders(),
    }).pipe(catchError(this.handleError));
  }

  // Add login activity to activity_logs view (Login)
  logUserActivity(activityLog: any): Observable<any> {
    const activityId = `activitylogs_2_${uuidv4()}`;
    activityLog = { ...activityLog, _id: activityId };
    return this.http.post(`${this.baseUrl}`, activityLog, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Get all user activity logs
  getUserActivityLogs(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/_design/views/_view/activity_logs`, {
      headers: this.getHeaders(),
    }).pipe(catchError(this.handleError));
  }

  uploadNewFile(payload: { fileName: string; fileData: File; fileType: string; type: 'file' }) {
    return this.http.post(
      `${this.baseUrl}`,
      { _id: `uploaded_files_2_${uuidv4()}`, data: { ...payload, userId: 'registerdetails_2_35f2bf2a-4bb9-4b9d-a83c-1b1469ba6642' } },
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  deleteFromCouchDB(fileId: string, revId: string): Observable<any> {
    const url = `${this.baseUrl}/${fileId}?rev=${revId}`; // Include the revision ID in the URL
    // Add authentication headers
    const headers = new HttpHeaders({
      Authorization: `Basic ${this.credentials}`,
    });
    return this.http.delete(url, { headers : this.getHeaders()}).pipe(catchError(this.handleError));
  }

  getParticularUserFile(userId: string) {
    console.log('Fetching files for user:', userId); // Log the userId
    return this.http.get<any>(
      `${this.baseUrl}/_design/views/_view/uploaded_files?key="${userId}"&include_docs=true`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  getDeletedFiles(userId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/_design/views/_view/deleted_files?key="${userId}"&include_docs=true`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  saveEncryptedData(fileName: string, encryptedData: string, mimeType: string, userId: string): Observable<any> {
    const payload = {
      fileName: fileName,
      fileData: encryptedData, // Ensure this field is included
      mimeType: mimeType,
      uploadedDate: new Date(),
      type: 'file',
      userId: userId,
    };
    console.log('Saving to CouchDB with payload:', payload); // Log the payload
    return this.http.post(
      `${this.baseUrl}`,
      { _id: `file_2_${uuidv4()}`, data: payload },
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // Fetch encrypted data from CouchDB
  async fetchFromCouchDB(fileId: string): Promise<any> {
    try {
      const response = await this.http.get<any>(`${this.baseUrl}/${fileId}`, { headers: this.getHeaders() }).toPromise();
      console.log('Fetched data from CouchDB:', response); // Log the response
      if (response && response.data && response.data.fileData) {
        return response;
      } else {
        throw new Error('Invalid or missing encrypted data');
      }
    } catch (error) {
      console.error('Error fetching data from CouchDB:', error);
      throw error;
    }
  }

  // Encrypt file
  encryptFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = reader.result as ArrayBuffer;
        const wordArray = CryptoJS.lib.WordArray.create(fileData);
        const encrypted = CryptoJS.AES.encrypt(wordArray, this.secretKey).toString();
        resolve(encrypted);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  // Decrypt file
  decryptFile(encryptedData: string, mimeType: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
        const decryptedArrayBuffer = this.wordArrayToArrayBuffer(decrypted);
        const blob = new Blob([decryptedArrayBuffer], { type: mimeType });
        resolve(blob);
      } catch (error) {
        console.error('Error decrypting file:', error);
        reject(error);
      }
    });
  }

  // Save encrypted data to CouchDB
  saveToCouchDB(fileName: string, encryptedData: string, mimeType: string, userId: string): Observable<any> {
    const payload = {
      fileName: fileName,
      fileData: encryptedData, // Ensure this field is included
      mimeType: mimeType,
      uploadedDate: new Date(),
      type: 'file',
      userId: userId,
      // _attachments:{
      //   [fileName]:{
      //     filecontent:encryptedData,
      //     filetype:""

      //   }
      // }
    };
    console.log('Saving to CouchDB with payload:', payload); // Log the payload
    return this.http.post(
      `${this.baseUrl}`,
      { _id: `file_2_${uuidv4()}`, data: payload },
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // Update file name in CouchDB
  updateFileNameInCouchDB(fileDetail : any): Observable<any> {
    const url = `${this.baseUrl}/${fileDetail._id}`;

    return this.http.put(url, fileDetail, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Move file to recycle bin (soft delete)
  moveFileToRecycleBin(fileId: string, revId: string, file: any): Observable<any> {
    const url = `${this.baseUrl}/${fileId}`;
    const payload = {
      _id: fileId,
      _rev: revId,
      data: {
        fileName: file.fileName,
        mimeType: file.mimeType,
        uploadedDate: file.uploadedDate,
        type: "deleted_file", // Change type to indicate deleted file
        userId: file.userId, // Preserve the user ID
        fileData: file.fileData
      }
    };

    return this.http.put(url, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Restore file from recycle bin
  restoreFileFromRecycleBin(fileId: string, revId: string, file: any): Observable<any> {
    const url = `${this.baseUrl}/${fileId}`;
    const payload = {
      _id: fileId,
      _rev: revId,
      data: {
        fileName: file.fileName,
        mimeType: file.mimeType,
        uploadedDate: file.uploadedDate,
        type: 'file', // Change type back to file
        userId: file.userId,
        fileData: file.fileData,
      },
    };
    return this.http.put(url, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Convert CryptoJS WordArray to ArrayBuffer
  private wordArrayToArrayBuffer(wordArray: CryptoJS.lib.WordArray): ArrayBuffer {
    const byteArray = new Uint8Array(wordArray.words.length * 4);
    for (let i = 0; i < wordArray.words.length; i++) {
      const word = wordArray.words[i];
      byteArray[i * 4] = (word >> 24) & 0xff;
      byteArray[i * 4 + 1] = (word >> 16) & 0xff;
      byteArray[i * 4 + 2] = (word >> 8) & 0xff;
      byteArray[i * 4 + 3] = word & 0xff;
    }
    return byteArray.buffer;
  }

  fileSearchIndex(fileName : string){
    const url : string = `${this.baseUrl}/_design/search/_search/file_search?q=filename:${fileName}*&wildcard=true&include_docs=true`;
    return this.http.get(url, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
}