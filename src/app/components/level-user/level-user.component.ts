import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-level-user',
  templateUrl: './level-user.component.html',
  styleUrls: ['./level-user.component.scss'],
})
export class LevelUserComponent implements OnInit {

  @Input() allLevels: any[] = [];
  @Input() selectLevel: number = 0;
  @Input() size: number;
  @Input() userImage: string;

  constructor() { }

  ngOnInit() {
    if (this.selectLevel) {
      let index = this.allLevels.findIndex(obj => obj.id === this.selectLevel);
      if (index === -1) {
        this.selectLevel = 0;
      }
      else {
        this.selectLevel = index;
      }
    }
    else {
      this.selectLevel = 0;
    }
  }

  get viewBox(): string {
    return `-${this.size * 0.5625} -${this.size * 0.5625} ${this.size * 1.125} ${this.size * 1.125}`;
  }

  get strokeWidth(): number {
    return this.size * 0.0375; // 3/80
  }

  get markerRadius(): number {
    return this.size * 0.0625; // 5/80
  }

  get imageSize(): number {
    return this.size * 0.75; // 60/80
  }

  getCirclePath(index: number): string {
    const circleRadius = this.size / 2;
    const circleAngleSize = 360 / this.allLevels.length;

    const gapAngleSize = ((this.size / 50) / circleRadius) * (180 / Math.PI);
    const levelAngleSize = circleAngleSize - gapAngleSize;

    const startingOffset = circleRadius / 20;
    // Marker to the right of level
    const startAngle = (index * circleAngleSize) + startingOffset;
    const endAngle = startAngle + levelAngleSize;

    // Start/end position
    const startX = circleRadius * Math.cos(this.degToRad(startAngle - 90));
    const startY = circleRadius * Math.sin(this.degToRad(startAngle - 90));

    const endX = circleRadius * Math.cos(this.degToRad(endAngle - 90));
    const endY = circleRadius * Math.sin(this.degToRad(endAngle - 90));

    const largeArcFlag = (endAngle - startAngle) <= 180 ? 0 : 1;

    return `M ${startX} ${startY} A ${circleRadius} ${circleRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  }

  getMarkerPosition() {
    const circleRadius = this.size / 2;
    const circleAngleSize = 360 / this.allLevels.length;
    const sizeMarker = this.markerRadius * 2;

    const gapAngleSize = ((this.size / 20) / circleRadius) * (180 / Math.PI);
    const levelAngleSize = circleAngleSize - gapAngleSize;

    // Start angle for the selected level
    const shiftAdjustment = circleAngleSize; //manually to fit in gap;
    const startAngle = ((this.selectLevel + 1) * circleAngleSize) - shiftAdjustment;
    const markerAngle = startAngle + levelAngleSize + sizeMarker; // middle of the gap

    const x = circleRadius * Math.cos(this.degToRad(markerAngle - 90));
    const y = circleRadius * Math.sin(this.degToRad(markerAngle - 90));

    if (isNaN(x) || isNaN(y)) {
      //  console.error('getMarkerPosition: Calculated position is NaN');
      return { x: 0, y: 0 }; // Default safe position
    }

    return { x, y };
  }

  degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  getCircleColor(index: number, selectLevel: number): string {
    if (index <= selectLevel) {
      return this.allLevels[index].color;
    } else {
      return this.allLevels[index].inactive_color ?
        this.allLevels[index].inactive_color : this.lightenColor(this.allLevels[index].color, 30);;
    }
  }

  lightenColor(hexColor: string, percent: number): string {
    let r: any = parseInt(hexColor.substring(1, 3), 16);
    let g: any = parseInt(hexColor.substring(3, 5), 16);
    let b: any = parseInt(hexColor.substring(5, 7), 16);

    // Increase the lightness
    r = Math.round(r + (255 - r) * percent / 100);
    g = Math.round(g + (255 - g) * percent / 100);
    b = Math.round(b + (255 - b) * percent / 100);

    // Convert RGB back to hex
    r = r.toString(16).padStart(2, '0');
    g = g.toString(16).padStart(2, '0');
    b = b.toString(16).padStart(2, '0');

    return '#' + r + g + b;
  }

}
