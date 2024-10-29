import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ScreenSizeService {
    private screenWidth$ = new BehaviorSubject<number>(window.innerWidth);
    constructor() {
        this.updateScreenWidth(); // Set initial width
        window.addEventListener('resize', this.updateScreenWidth.bind(this));
    }
    private updateScreenWidth(): void {
        this.screenWidth$.next(window.innerWidth);
    }
    getScreenWidth() {
        return this.screenWidth$.asObservable();
    }
}
