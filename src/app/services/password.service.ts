
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PasswordService {

  private readonly upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private readonly lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
  private readonly numericChars = '0123456789';
  private readonly specialChars = '!@#$%^&*()_+-=[]{};:\'"\\|,.<>/?';

  constructor() {}

  generateRandomPassword(length: number = 12): string {
    // Ensure the password length is at least 4
    if (length < 4) {
      throw new Error('Password length must be at least 4 characters.');
    }

    // Create arrays of different character types
    const allChars = this.upperCaseChars + this.lowerCaseChars + this.numericChars + this.specialChars;
    const passwordArray = [
      this.getRandomChar(this.upperCaseChars),
      this.getRandomChar(this.lowerCaseChars),
      this.getRandomChar(this.numericChars),
      this.getRandomChar(this.specialChars),
    ];

    // Fill the remaining length with random characters
    for (let i = 4; i < length; i++) {
      passwordArray.push(this.getRandomChar(allChars));
    }

    // Shuffle the array to remove any predictable patterns
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }

    // Join the array into a string and return
    return passwordArray.join('');
  }

  private getRandomChar(chars: string): string {
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }
}

