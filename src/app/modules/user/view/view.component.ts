import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { CouchdbService } from '../../../services/couchdb.service';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})
export class ViewComponent implements OnInit {
  fileId: string | null = null;
  file: any = null;
  isLoading = true;

  // For PDF and image rendering
  pdfSrc: SafeUrl | null = null;
  imageSrc: SafeUrl | null = null;

  // For text file rendering
  textContent: string | null = null;

  minZoomLevel:number=0.5;
  maxZoomLevel:number=2;

  // For DOCX rendering
  @ViewChild('docxViewer', { static: false }) docxViewer!: ElementRef;

  fileViewerUrl: SafeResourceUrl | null = null;
  docxContent: string | null = null;
  zoomLevel: number = 1;
  isFullScreen: boolean = false;
  isProcessing: boolean = false; // For loading animation
  isFavorite: boolean = false; // For favorite files
  imageRotation: number = 0; // For image rotation
  isReading: boolean = false; // For read aloud state
  isEditing: boolean = false; // For enabling editing
  copiedText: string | null = null; // For copied text
  speechSynthesis: SpeechSynthesis | null = null; // For speech synthesis
  utterance: SpeechSynthesisUtterance | null = null; // For speech utterance

  constructor(
    private readonly sanitizer: DomSanitizer,
    private readonly route: ActivatedRoute,
    private readonly couchDbService: CouchdbService,
    private readonly snackBar: MatSnackBar
  ) {
    this.speechSynthesis = window.speechSynthesis; // Initialize speech synthesis
  }

  ngOnInit() {
    // Get the file ID from the route parameters
    this.fileId = this.route.snapshot.paramMap.get('fileId');
    if (this.fileId) {
      this.fetchFileData(this.fileId);
    } else {
      console.error('No file ID found in route parameters.');
      this.snackBar.open('File not found.', 'Close', { duration: 3000 });
    }
  }

  async fetchFileData(fileId: string) {
    this.isLoading = true;
    try {
      // Fetch the file data from CouchDB
      const encryptedData = await this.couchDbService.fetchFromCouchDB(fileId);
      console.log('Fetched encrypted data:', encryptedData);

      // Decrypt the file data
      const decryptedBlob = await this.couchDbService.decryptFile(
        encryptedData.data.fileData,
        encryptedData.data.mimeType
      );

      // Prepare the file object for rendering
      this.file = {
        fileName: encryptedData.data.fileName,
        data: decryptedBlob,
        uploadedDate: encryptedData.data.uploadedDate,
        mimeType: encryptedData.data.mimeType,
        type: 'file',
      };

      // Render the file content
      this.renderFileContent();
    } catch (error) {
      console.error('Error fetching or decrypting file:', error);
      this.snackBar.open('Error loading file preview.', 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  getSafeUrl(blob: Blob): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
  }

  renderFileContent() {
    if (this.file.mimeType === 'application/pdf') {
      this.renderPdf();
    } else if (this.file.mimeType === 'text/plain') {
      this.renderText();
    } else if (this.file.mimeType.startsWith('image/')) {
      this.renderImage();
    } else if (
      this.file.mimeType === 'application/msword' ||
      this.file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      this.renderDocx();
    } else {
      console.error('Unsupported file type:', this.file.mimeType);
      this.snackBar.open('Unsupported file type.', 'Close', { duration: 3000 });
    }
  }

  renderPdf() {
    // Create a safe URL for the PDF blob
    this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(
      URL.createObjectURL(this.file.data)
    );
  }

  renderText() {
    // Read the text content from the blob
    const reader = new FileReader();
    reader.onload = () => {
      this.textContent = reader.result as string;
    };
    reader.readAsText(this.file.data);
  }

  renderImage() {
    // Create a safe URL for the image blob
    this.imageSrc = this.sanitizer.bypassSecurityTrustUrl(
      URL.createObjectURL(this.file.data)
    );
  }

  async renderDocx() {
    try {
      // Lazy load the docx-preview library
      const docx = await import('docx-preview');
      if (this.docxViewer) {
        this.docxViewer.nativeElement.innerHTML = ''; // Clear previous content
        docx.renderAsync(this.file.data, this.docxViewer.nativeElement);
      }
    } catch (error) {
      console.error('Error rendering DOCX file:', error);
      this.snackBar.open('Error rendering DOCX file.', 'Close', { duration: 3000 });
    }
  }

  downloadFile(): void {
    if (this.file) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(this.file.data);
      link.download = this.file.fileName;
      link.click();
    } else {
      console.error('File is not available for download.');
    }
  }

  zoomIn(): void {
    if(this.zoomLevel<this.maxZoomLevel){
      this.zoomLevel+=0.1
    }else{
      this.snackBar.open('Maximum zoom level reached.','Close',{duration:2000});
    }
  }

  zoomOut(): void {
    if(this.zoomLevel>this.minZoomLevel){
      this.zoomLevel-=0.1;
    }else{
      this.snackBar.open('Minimum zoom level reached','Close',{duration:2000})
    }
  }

  toggleFullScreen(): void {
    this.isFullScreen = !this.isFullScreen;
  }

  exitFullScreen():void{
    this.isFullScreen=false;
  }

  rotateImage(): void {
    this.imageRotation = (this.imageRotation + 90) % 360;
  }

  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
    localStorage.setItem('favorite', this.isFavorite.toString());
  }

  readAloud(): void {
    if (this.speechSynthesis && (this.textContent || this.docxContent)) {
      if (this.isReading) {
        // Stop reading
        this.speechSynthesis.cancel();
        this.isReading = false;
      } else {
        // Start reading
        const text = this.textContent || this.docxContent;
        if (text) {
          this.utterance = new SpeechSynthesisUtterance(text);
          this.utterance.onend = () => {
            this.isReading = false; // Update state when reading ends
          };
          this.speechSynthesis.speak(this.utterance);
          this.isReading = true;
        }
      }
    }
  }

  toggleEditing(): void {
    this.isEditing = !this.isEditing;
  }

  copyText(): void {
    const textToCopy = this.textContent || this.docxContent;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.copiedText = 'Text copied to clipboard!';
        setTimeout(() => (this.copiedText = null), 2000); // Clear message after 2 seconds
      });
    }
  }

  saveText(): void {
    if (this.textContent && this.file) {
      const blob = new Blob([this.textContent], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = this.file.fileName;
      link.click();
    }
  }

  saveDocx(): void {
    if (this.docxContent && this.file) {
      const blob = new Blob([this.docxContent], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = this.file.fileName;
      link.click();
    }
  }
}