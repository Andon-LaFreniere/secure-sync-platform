import { Component, OnInit } from '@angular/core';
import { FileService, FileInfo } from '../../services/file.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="container">
      <div class="card">
        <h2 style="margin-bottom: 30px; color: #667eea;">
          📁 My Files Dashboard
        </h2>

        <!-- Upload Area -->
        <div 
          class="upload-area"
          [class.dragover]="isDragOver"
          (click)="fileInput.click()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          <div style="font-size: 48px; margin-bottom: 20px;">☁️</div>
          <h3>Drop files here or click to upload</h3>
          <p style="color: #666; margin-top: 10px;">
            Your files are encrypted end-to-end for maximum security
          </p>
          <input 
            #fileInput
            type="file" 
            style="display: none;" 
            (change)="onFileSelected($event)"
            multiple
          >
        </div>

        <!-- Upload Progress -->
        <div *ngIf="uploading" class="alert alert-success">
          <div class="loading">
            <div class="spinner"></div>
            <span style="margin-left: 15px;">Encrypting and uploading files...</span>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div *ngIf="message" class="alert alert-success">
          {{ message }}
        </div>
        <div *ngIf="error" class="alert alert-error">
          {{ error }}
        </div>

        <!-- File Statistics -->
        <div *ngIf="files.length > 0" style="margin: 30px 0;">
          <h3 style="color: #333;">📊 Storage Overview</h3>
          <div style="display: flex; gap: 30px; margin-top: 15px;">
            <div>
              <strong>Total Files:</strong> {{ files.length }}
            </div>
            <div>
              <strong>Total Size:</strong> {{ getTotalSize() }}
            </div>
          </div>
        </div>

        <!-- Files List -->
        <div class="file-list" *ngIf="files.length > 0">
          <h3 style="margin-bottom: 20px; color: #333;">🗂️ Your Files</h3>
          <div class="file-item" *ngFor="let file of files">
            <div class="file-info">
              <h4>{{ file.filename }}</h4>
              <p>
                Size: {{ formatFileSize(file.size) }} • 
                Uploaded: {{ formatDate(file.uploadDate) }}
                <span *ngIf="file.downloadCount !== undefined"> • 
                  Downloads: {{ file.downloadCount }}
                </span>
              </p>
            </div>
            <div class="file-actions">
              <button 
                class="btn btn-primary" 
                (click)="downloadFile(file)"
                [disabled]="downloading === file.id"
              >
                {{ downloading === file.id ? 'Downloading...' : '⬇️ Download' }}
              </button>
              <button 
                class="btn btn-danger" 
                (click)="deleteFile(file)"
                [disabled]="deleting === file.id"
              >
                {{ deleting === file.id ? 'Deleting...' : '🗑️ Delete' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="files.length === 0 && !loading" style="text-align: center; padding: 40px;">
          <div style="font-size: 64px; margin-bottom: 20px;">📭</div>
          <h3 style="color: #666;">No files yet</h3>
          <p style="color: #999;">Upload your first file to get started!</p>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <span style="margin-left: 15px;">Loading your files...</span>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  files: FileInfo[] = [];
  currentUser: User | null = null;
  loading = false;
  uploading = false;
  downloading = '';
  deleting = '';
  message = '';
  error = '';
  isDragOver = false;

  constructor(
    private fileService: FileService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadFiles();
  }

  loadFiles(): void {
    this.loading = true;
    this.fileService.getMyFiles().subscribe({
      next: (response) => {
        this.files = response.files;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load files';
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploadFiles(Array.from(files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFiles(Array.from(files));
    }
  }

  uploadFiles(files: File[]): void {
    this.uploading = true;
    this.error = '';
    
    // Upload files one by one
    let uploadedCount = 0;
    const totalFiles = files.length;

    files.forEach(file => {
      this.fileService.uploadFile(file).subscribe({
        next: (response) => {
          uploadedCount++;
          if (uploadedCount === totalFiles) {
            this.uploading = false;
            this.message = `Successfully uploaded ${totalFiles} file(s)`;
            this.loadFiles();
            setTimeout(() => this.message = '', 3000);
          }
        },
        error: (error) => {
          this.uploading = false;
          this.error = `Failed to upload ${file.name}`;
          setTimeout(() => this.error = '', 5000);
        }
      });
    });
  }

  downloadFile(file: FileInfo): void {
    this.downloading = file.id;
    this.fileService.downloadFile(file.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        link.click();
        window.URL.revokeObjectURL(url);
        this.downloading = '';
        this.message = `Downloaded ${file.filename}`;
        setTimeout(() => this.message = '', 3000);
      },
      error: (error) => {
        this.downloading = '';
        this.error = `Failed to download ${file.filename}`;
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  deleteFile(file: FileInfo): void {
    if (confirm(`Are you sure you want to delete ${file.filename}?`)) {
      this.deleting = file.id;
      this.fileService.deleteFile(file.id).subscribe({
        next: () => {
          this.deleting = '';
          this.message = `Deleted ${file.filename}`;
          this.loadFiles();
          setTimeout(() => this.message = '', 3000);
        },
        error: (error) => {
          this.deleting = '';
          this.error = `Failed to delete ${file.filename}`;
          setTimeout(() => this.error = '', 5000);
        }
      });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getTotalSize(): string {
    const totalBytes = this.files.reduce((sum, file) => sum + file.size, 0);
    return this.formatFileSize(totalBytes);
  }