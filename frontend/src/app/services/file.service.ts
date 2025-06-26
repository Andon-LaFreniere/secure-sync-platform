import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface FileInfo {
  id: string;
  filename: string;
  size: number;
  uploadDate: string;
  downloadCount?: number;
}

export interface FilesResponse {
  files: FileInfo[];
}

export interface UploadResponse {
  message: string;
  file: FileInfo;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = 'http://localhost:3000/api/files';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData, {
      headers: this.getHeaders()
    });
  }

  getMyFiles(): Observable<FilesResponse> {
    return this.http.get<FilesResponse>(`${this.apiUrl}/my-files`, {
      headers: this.getHeaders()
    });
  }

  downloadFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${fileId}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  deleteFile(fileId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${fileId}`, {
      headers: this.getHeaders()
    });
  }
}