import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="navbar-content">
        <div class="logo">🔒 Secure Sync</div>
        <div class="nav-links">
          <span *ngIf="currentUser">Welcome, {{ currentUser.name }}!</span>
          <button *ngIf="currentUser" class="btn btn-secondary" (click)="logout()">
            Logout
          </button>
          <div *ngIf="!currentUser">
            <a routerLink="/login" class="btn btn-primary" style="margin-right: 10px;">Login</a>
            <a routerLink="/register" class="btn btn-secondary">Register</a>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: []
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}