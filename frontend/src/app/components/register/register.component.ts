import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="container">
      <div class="card" style="max-width: 400px; margin: 50px auto;">
        <h2 style="text-align: center; margin-bottom: 30px; color: #667eea;">
          Join Secure Sync
        </h2>
        
        <div *ngIf="error" class="alert alert-error">
          {{ error }}
        </div>

        <div *ngIf="success" class="alert alert-success">
          {{ success }}
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              formControlName="name"
              [class.error]="registerForm.get('name')?.invalid && registerForm.get('name')?.touched"
            >
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
            >
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
            >
            <small style="color: #666;">Minimum 6 characters</small>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary" 
            style="width: 100%; margin-bottom: 20px;"
            [disabled]="registerForm.invalid || loading"
          >
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <p style="text-align: center;">
          Already have an account? 
          <a routerLink="/login" style="color: #667eea; text-decoration: none;">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .error {
      border-color: #dc3545 !important;
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      const { name, email, password } = this.registerForm.value;

      this.authService.register(email, password, name).subscribe({
        next: () => {
          this.success = 'Account created successfully! Redirecting...';
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: (error) => {
          this.error = error.error?.error || 'Registration failed';
          this.loading = false;
        }
      });
    }
  }
}