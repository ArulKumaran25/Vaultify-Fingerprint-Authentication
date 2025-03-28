  import { Component, ElementRef, ViewChild } from '@angular/core';
  import { CouchdbService } from '../../../services/couchdb.service';
  import { Router } from '@angular/router';
  import { MatSnackBar } from '@angular/material/snack-bar';
import e from 'cors';

  interface fileDataStructure {
    fileId: string,
    fileName: string;
    fileData: string; // Encrypted file data as a string
    uploadedDate: Date;
    mimeType: string;
    type: "file" | "deleted_file";
    userId: string; // Add userId to the interface
  }

  @Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
  })
  export class DashboardComponent {

    constructor(
      private readonly couchDbService: CouchdbService,
      readonly router: Router,
      private readonly snackBar: MatSnackBar
    ) { }

    @ViewChild('docxViewer', { static: false }) docxViewer!: ElementRef; // Reference to the container
    encryptedFileData: string | null = null;
    decryptedBlob: Blob | null = null;
    fileName: string | null = null;
    fileType: string | null = null;
    fileList: { fileId: string, name: string; type: string }[] = [];

    filteredFiles: fileDataStructure[] = [];
    recycleBinFiles: fileDataStructure[] = [];
    allFiles: Map<string, { revId: string, data: fileDataStructure }> = new Map();
    filteredFilesMap: Map<string, { revId: string, data: fileDataStructure }> = new Map();
    recycleBinFilesMap: Map<string, { revId: string, data: fileDataStructure }> = new Map();
    pdfSrc: string | null = null;
    imageSrc: string | null = null;
    textContent: string | null = null;
    docSrc: string | null = null;

    isDragOver = false;
    selectedFiles: File[] = [];
    uploadMessage = '';
    uploadButtonText = 'Upload Files';

    // Search & Sorting
    searchQuery = '';
    sortBy = 'name';

    // File List
    files: any[] = []; // Array to store uploaded files
    renameIndex: number | null = null; // Index of the file being renamed
    newFileName = ''; // New name for the file being renamed

    // File Preview
    isPreviewOpen = false;
    previewFile: any = null;
    previewTextContent = '';
    previewDocxContent = '';
    isLoadingPreview = true; // Loading Indicators
    isFetchingFile = false;
    searchValue : string = "";

    // Accepted file types and maximum file size
    acceptedFileTypes = '.pdf, .docx, .txt, image/*';
    maxFileSizeMB = 5;
    maxFileSizeBytes = this.maxFileSizeMB * 1024 * 1024; // Convert MB to bytes

    ngOnInit() {
      this.getUserFiles();
      this.getRecycleBinFiles();
    }

    searchUsingFileName(){
      if(!this.searchValue){
        this.filteredFiles = [];
        this.allFiles.forEach((value, key) => {
          this.filteredFiles.push(value.data);
        })
        return;
      }
      this.couchDbService.fileSearchIndex(this.searchValue).subscribe(
        (response : any) => {
          let filteredIds : string[] = [];
          console.log(response)
          response.rows.forEach((e :any) => {
            filteredIds.push(e.doc._id);
          })
          this.filteredFiles = [];
          this.allFiles.forEach((value, key) => {
            if(filteredIds.includes(key)){
              this.filteredFiles.push(value.data);
              // this.filteredFilesMap.set(key, value);
            }
          })
  
        }
              )
    }
    // Get the logged-in user's ID
    getUserId(): string {
      // Check if localStorage is available
      if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        console.error('localStorage is not available.');
        this.snackBar.open('Local storage is not available.', 'Close', { duration: 3000 });
        throw new Error('localStorage is not available.');
      }

      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('User ID not found in local storage.'); 
        this.snackBar.open('User not logged in.', 'Close', { duration: 3000 });
        throw new Error('User ID not found.');
      }

      console.log('User ID retrieved from local storage:', userId); 
      return userId;
    }

    getUserFiles(): void {
      const userId = this.getUserId();
      this.couchDbService.getParticularUserFile(userId).subscribe({
        next: (response: any) => {
          console.log('Fetched files from CouchDB:', response); // Log the raw response from CouchDB
          this.filteredFiles = response.rows.map((e: any) => ({
            fileId: e.doc._id,
            fileName: e.doc.data.fileName,
            fileData: e.doc.data.fileData, // Encrypted file data as a string
            uploadedDate: e.doc.data.uploadedDate,
            mimeType: e.doc.data.mimeType,
            type: e.doc.data.type,
            userId: e.doc.data.userId
           }));
          console.log('Filtered files:', this.filteredFiles); // Log the processed files
          response.rows.forEach((e: any) => {
            console.log('Adding to filteredFilesMap:', e.doc._id, e.doc._rev, e.doc.data); // Log each file being added to the map
            this.filteredFilesMap.set(e.doc._id, { revId: e.doc._rev, data: e.doc.data });
            this.allFiles.set(e.doc._id, { revId: e.doc._rev, data: e.doc.data });
          });
          console.log('filteredFilesMap:', this.filteredFilesMap); // Log the final state of the map
        },
        error: (error: any) => {
          console.log('Error fetching files:', error); // Log any errors
        },
      });
    }

    getRecycleBinFiles(): void {
      const userId = this.getUserId(); // Get the logged-in user's ID
      this.couchDbService.getDeletedFiles(userId).subscribe({
        next: (response: any) => {
          console.log('Recycle Bin Files:', response);
          this.recycleBinFiles = response.rows.map((e: any) => e.doc.data);
          console.log(this.recycleBinFiles);
          response.rows.forEach((e: any) => this.recycleBinFilesMap.set(e.doc._id, { revId: e.doc._rev, data: e.doc.data }));
          console.log(this.recycleBinFilesMap);
        },
        error: (error: any) => {
          console.error('Error fetching recycle bin files:', error);
          this.snackBar.open('Error fetching recycle bin files.', 'Close', { duration: 3000 });
        }
      });
    }

    // Drag & Drop
    onDragOver(event: DragEvent) {
      event.preventDefault();
      this.isDragOver = true;
    }
    onDragLeave() {
      this.isDragOver = false;
    }

    onDrop(event: DragEvent) {
      event.preventDefault();
      this.isDragOver = false;
      if (event.dataTransfer?.files) {
        this.selectedFiles = Array.from(event.dataTransfer.files);
      }
    }

    // File Selection
    onFileSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files) {
        this.selectedFiles = Array.from(input.files);
        console.log(this.selectedFiles);
        
      }
    }

    filterFiles() {
      this.filteredFiles = this.files.filter((file) =>
        file.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Sort Files
    sortFiles(event: Event) {
      const select = event.target as HTMLSelectElement;
      this.sortBy = select.value;
      this.filteredFiles.sort((a, b) => {
        if (this.sortBy === 'name') {
          return a.fileName.localeCompare(b.fileName);
        } else if (this.sortBy === 'date') {
          return new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime();
        } else if (this.sortBy === 'type') {
          return a.mimeType.localeCompare(b.mimeType);
        }
        return 0;
      });
    }

    // Rename File
    editFileName(index: number) {
      this.renameIndex = index;
      this.newFileName = this.filteredFiles[index].fileName;
    }

    saveFileName(index: number) {
      // console.log("NEW NAME : ",this.newFileName);
      if (this.newFileName.trim()) {
        const file = this.filteredFiles[index]; // Get the file to update
        const oldFileName = file.fileName; // Store the old file name
        file.fileName = this.newFileName; // Update the file name locally
        // console.log(file)
        let fileDataToUpdate : any = {}
        // Find the file ID and revision ID from the filteredFilesMap
        this.filteredFilesMap.forEach((value, key) => {
          if(file.fileId === key){
            console.log(value); 
            fileDataToUpdate.data = value.data;
            fileDataToUpdate.data.fileName = this.newFileName;
            fileDataToUpdate._id = key;
            fileDataToUpdate._rev = value.revId;
          }
        });

        // Update the file name in CouchDB
        this.couchDbService
          .updateFileNameInCouchDB(fileDataToUpdate)
          .subscribe({
            next: (response: any) => {
              console.log('File name updated successfully in CouchDB:', response); // Log the success response
              this.renameIndex = null;
              this.newFileName = '';

              // Update the file name in the filteredFilesMap
              const fileData = this.filteredFilesMap.get(file.fileId);
              if (fileData) {
                fileData.data.fileName = this.newFileName;
                fileData.revId = response.rev;
                this.filteredFilesMap.set(file.fileId, fileData);
              }
              this.snackBar.open('File name updated successfully!', 'Close', { duration: 3000 });
            },
            error: (error: any) => {
              console.error('Error updating file name in CouchDB:', error); // Log the error
              file.fileName = oldFileName; // Revert the file name locally if the update fails
              this.snackBar.open('Error updating file name.', 'Close', { duration: 3000 });
            },
          });
      }
    }

    // Delete File
    deleteFile(index: number) {
      console.log(this.filteredFiles[index])
      // console.log(index);
      const file = this.filteredFiles[index]; // Get the file to delete
      console.log(this.filteredFilesMap.get(file.fileId))
      if (!file) {
        console.error('File not found.');
        this.snackBar.open('File not found.', 'Close', { duration: 3000 });
        return;
      }
      // Find the file ID and revision ID from the filteredFilesMap
      let fileId: string = file.fileId;
      let revId: string = this.filteredFilesMap.get(file.fileId)?.revId ?? "";

      if (!fileId || !revId) {
        console.error('File ID or revision ID not found.');
        this.snackBar.open('File ID or revision ID not found.', 'Close', { duration: 3000 });
        return;
      }

      // Move the file to the recycle bin (soft delete)
      this.couchDbService.moveFileToRecycleBin(fileId, revId, file).subscribe({
        next: (response: any) => {
          console.log('File moved to recycle bin successfully:', response);
          // Remove the file from the local filteredFiles array
          this.filteredFiles.splice(index, 1);
          // Remove the file from the filteredFilesMap
          this.filteredFilesMap.delete(fileId);
          // Add the file to the recycle bin
          this.recycleBinFiles.push(file);
          this.recycleBinFilesMap.set(fileId, { revId: response.rev, data: file });
          this.snackBar.open('File moved to recycle bin successfully!', 'Close', { duration: 3000 });
        },
        error: (error: any) => {
          console.error('Error moving file to recycle bin:', error);
          this.snackBar.open('Error moving file to recycle bin.', 'Close', { duration: 3000 });
        },
      });
    }

    // Permanently delete file from recycle bin
    deleteFromRecycleBin(index: number) {
      const file = this.recycleBinFiles[index]; // Get the file to delete
      if (!file) {
        console.error('File not found.');
        this.snackBar.open('File not found.', 'Close', { duration: 3000 });
        return;
      }
      // Find the file ID and revision ID from the recycleBinFilesMap
      let fileId: string = '';
      let revId: string = '';
      this.recycleBinFilesMap.forEach((value, key) => {
        if (value.data === file) {
          fileId = key;
          revId = value.revId;
        }
      });
      console.log(file);
      
      if (!fileId || !revId) {
        console.error('File ID or revision ID not found.');
        this.snackBar.open('File ID or revision ID not found.', 'Close', { duration: 3000 });
        return;
      }

      // Permanently delete the file from CouchDB
      this.couchDbService.deleteFromCouchDB(fileId, revId).subscribe({
        next: (response: any) => {
          console.log('File deleted permanently from CouchDB:', response);
          // Remove the file from the local recycleBinFiles array
          this.recycleBinFiles.splice(index, 1);
          // Remove the file from the recycleBinFilesMap
          this.recycleBinFilesMap.delete(fileId);
          
          this.snackBar.open('File deleted permanently!', 'Close', { duration: 3000 });
        },
        error: (error: any) => {
          console.error('Error deleting file from CouchDB:', error);
          this.snackBar.open('Error deleting file.', 'Close', { duration: 3000 });
        },
      });
    }

    // Restore file from recycle bin
    restoreFile(index: number) {
      const file = this.recycleBinFiles[index]; // Get the file to restore
      if (!file) {
        console.error('File not found.');
        this.snackBar.open('File not found.', 'Close', { duration: 3000 });
        return;
      }
      // Find the file ID and revision ID from the recycleBinFilesMap
      let fileId: string = '';
      let revId: string = '';
      this.recycleBinFilesMap.forEach((value, key) => {
        if (value.data === file) {
          fileId = key;
          revId = value.revId;
        }
      });

      if (!fileId || !revId) {
        console.error('File ID or revision ID not found.');
        this.snackBar.open('File ID or revision ID not found.', 'Close', { duration: 3000 });
        return;
      }

      // Restore the file to the user's file list
      this.couchDbService.restoreFileFromRecycleBin(fileId, revId, file).subscribe({
        next: (response: any) => {
          console.log('File restored successfully:', response);
          // Remove the file from the local recycleBinFiles array
          this.recycleBinFiles.splice(index, 1);
          // Remove the file from the recycleBinFilesMap
          this.recycleBinFilesMap.delete(fileId);
          // Add the file to the user's file list
          this.filteredFiles.push(file);
          this.filteredFilesMap.set(fileId, { revId: response.rev, data: file });
          this.snackBar.open('File restored successfully!', 'Close', { duration: 3000 });
        },
        error: (error: any) => {
          console.error('Error restoring file:', error);
          this.snackBar.open('Error restoring file.', 'Close', { duration: 3000 });
        },
      });
    }

    // Download File
    downloadFile(file: fileDataStructure) {
      let fileId: string = file.fileId;
      // Find the file ID from the filteredFilesMap
      // this.filteredFilesMap.forEach((value, key) => {
      //   if (value.data === file) fileId = key;
      // });

      if (!fileId) {
        console.error('File ID not found.');
        this.snackBar.open('File ID not found.', 'Close', { duration: 3000 });
        return;
      }

      // Fetch the encrypted file data from CouchDB
      this.couchDbService.fetchFromCouchDB(fileId).then((encryptedData: any) => {
        // Decrypt the file data
        console.log(encryptedData);
        this.couchDbService.decryptFile(encryptedData.data.fileData, encryptedData.data.mimeType).then((decryptedBlob: Blob) => {
          // Create a Blob URL for the decrypted file
          const url = URL.createObjectURL(decryptedBlob);
          // Create a temporary link element
          const link = document.createElement('a');
          link.href = url;
          link.download = file.fileName; // Set the file name for download
          document.body.appendChild(link);
          // Trigger the download
          link.click();
          // Clean upS
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('File downloaded successfully:', file.fileName);
          this.snackBar.open('File downloaded successfully!', 'Close', { duration: 3000 });
        }).catch((error: any) => {
          console.error('Error decrypting file:', error);
          this.snackBar.open('Error decrypting file.', 'Close', { duration: 3000 });
        });
      }).catch((error: any) => {
        console.error('Error fetching file:', error);
        this.snackBar.open('Error fetching file.', 'Close', { duration: 3000 });
      });
    }

    // Close Preview
    closePreview() {
      this.isPreviewOpen = false;
      this.previewFile = null;
      this.previewTextContent = '';
      this.previewDocxContent = '';
    }

    // Navigate to External View
    navigateToView(fileId : string) {
      console.log(this.previewFile);
      
      this.filteredFilesMap.forEach((value, key) => {
        console.log(value.data);
        
        if(value.data == this.previewFile)
          console.log("IIDD",key)
      })
      if (fileId) {
        // Navigate to the file-viewer component with the file ID as a route parameter
        this.router.navigate(['/user/view', fileId]);
        console.log('Routing with file ID:', fileId);
      } else {
        console.error('No file ID found.');
        this.snackBar.open('No file selected for preview.', 'Close', { duration: 3000 });
      }
    }

    async onFileUpload(event: Event) {
      const userId = this.getUserId();
      if (this.selectedFiles.length > 0) {
        // Convert FileList to an array for easier iteration
        const files = this.selectedFiles;
        console.log('Selected files:', files); // Log the selected files
        // Process each file
        for (const file of files) {
          const fileName = file.name;
          const fileType = this.getMimeType(file.name);
          console.log(file);
          

          try {
            // Encrypt the file
            const encryptedFileData = await this.couchDbService.encryptFile(file);
            console.log('File encrypted successfully:', fileName); // Log the encrypted file
            console.log('Encrypted data:', encryptedFileData); // Log the encrypted data

            // Save encrypted data to CouchDB with the user ID
            this.couchDbService.saveToCouchDB(fileName, encryptedFileData, fileType, userId).subscribe({
              next: (response: any) => {
                console.log('File saved successfully:', response); // Log the success response
                const currentFileId = response.id;
                // Add the file to the file list
                this.fileList.push({ fileId: currentFileId, name: fileName, type: fileType });
                console.log('File saved to CouchDB:', fileName);
                this.selectedFiles = [];
                this.getUserFiles();
              },
              error: (error: any) => {
                console.error('Error saving file:', error); // Log the error
              },
            });
          } catch (error) {
            console.error('Error encrypting or saving file:', error); // Log the error
          }
        }
        this.filteredFilesMap.clear();
        this.filteredFiles = [];
        this.getUserFiles();
      }
    }

      // Handle file decryption and viewing
      async onViewFile(file: fileDataStructure) {
        this.isFetchingFile = true; // Show loading indicator for CouchDB fetch
        this.pdfSrc = "";
        this.textContent = "";
        this.imageSrc = ""; // Clear previous image preview
        this.isPreviewOpen = true;
        let fileId: string = "";
      
        // Find the file ID from the filteredFilesMap
        this.filteredFilesMap.forEach((value, key) => {
          if (value.data === file) fileId = key;
        });
      
        try {
          // Fetch the file from CouchDB
          const encryptedData = await this.couchDbService.fetchFromCouchDB(file.fileId);
          console.log('Fetched encrypted data:', encryptedData);
      
          // Verify the encrypted data
          if (!encryptedData || !encryptedData.data || !encryptedData.data.fileData) {
            throw new Error('Invalid or missing encrypted data');
          }
      
          // Hide loading indicator after fetch is complete
          this.isFetchingFile = false;
          // Decrypt the data
          this.decryptedBlob = await this.couchDbService.decryptFile(
            encryptedData.data.fileData,
            encryptedData.data.mimeType
          );
      

          console.log("BLOB", this.decryptedBlob)
          // Handle different file types
          if (encryptedData.data.mimeType === 'application/pdf') {
            this.pdfSrc = URL.createObjectURL(this.decryptedBlob);
          } else if (encryptedData.data.mimeType === 'text/plain') {
            const reader = new FileReader();
            reader.onload = () => {
              this.textContent = reader.result as string;
            };
            reader.readAsText(this.decryptedBlob);
          } else if (encryptedData.data.mimeType.startsWith('image/')) {
            // Handle image files
            const reader = new FileReader();
            reader.onload = () => {
              this.imageSrc = reader.result as string; // Set the image source
              console.log(this.imageSrc);
              
            };
            reader.readAsDataURL(this.decryptedBlob);
          } else if (
            encryptedData.data.mimeType === 'application/msword' ||
            encryptedData.data.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ) {
            // Lazy load docx-preview only in the browser
            const docx = await import('docx-preview');
            if (this.docxViewer) {
              this.docxViewer.nativeElement.innerHTML = ''; // Clear previous content
              docx.renderAsync(this.decryptedBlob, this.docxViewer.nativeElement);
            }
          } else {
            console.error('Unsupported file type:', encryptedData.data.mimeType);
          }
        } catch (error) {
          console.error('Error fetching or decrypting file:', error);
          this.snackBar.open('Error loading file preview.', 'Close', { duration: 3000 });
        } finally {
          this.isFetchingFile = false; // Hide loading indicator in case of error
        }
      }
    
    openFile(file: any): void {
      this.router.navigate(['/user/view'], { state: { file } });
    }

    // Get MIME type based on file extension
    private getMimeType(fileName: string): string {
      const extension = fileName.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'txt':
          return 'text/plain';
        case 'pdf':
          return 'application/pdf';
        case 'doc':
          return 'application/msword';
        case 'docx':
          return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls':
          return 'application/vnd.ms-excel';
        case 'xlsx':
          return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'ppt':
          return 'application/vnd.ms-powerpoint';
        case 'pptx':
          return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'zip':
          return 'application/zip';
        case 'json':
          return 'application/json';
        case 'csv':
          return 'text/csv';
        default:
          return 'application/octet-stream'; // Default MIME type for unknown files
      }
    }
  }