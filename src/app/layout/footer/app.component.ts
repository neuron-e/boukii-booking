import { Component, OnInit } from '@angular/core';
import { SchoolService } from 'src/app/services/school.service';

@Component({
  selector: 'app-footer',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class FooterComponent implements OnInit {
  constructor(private schoolService: SchoolService) { }
  SchoolData: any
  Socials: { facebook?: string; instagram?: string; x?: string; youtube?: string; tiktok?: string; linkedin?: string } = {};
  ngOnInit() {
    console.log('Footer component initialized');
    this.schoolService.fetchSchoolData().subscribe(
      (response) => {
        console.log('School data fetched successfully:', response);
      },
      (error) => {
        console.error('Error fetching school data:', error);
      }
    );
    this.schoolService.getSchoolData().subscribe((data: any) => {
      console.log('School data received in footer:', data);
      if (!data) return;
      this.SchoolData = data.data;
      try {
        const settings = this.SchoolData?.settings ? JSON.parse(this.SchoolData.settings) : {};
        const bookingSocial = settings?.booking?.social || {};
        const legacy = settings?.bookingPage?.socials || {};
        
        this.Socials = {
          facebook: bookingSocial.facebook || legacy.facebook || undefined,
          instagram: bookingSocial.instagram || legacy.instagram || undefined,
          x: bookingSocial.x || legacy.twitter || undefined,
          youtube: bookingSocial.youtube || legacy.youtube || undefined,
          tiktok: bookingSocial.tiktok || legacy.tiktok || undefined,
          linkedin: bookingSocial.linkedin || undefined,
        };
        
        // Debug: Check which socials are being set
        console.log('Social Media Debug:', {
          allSocials: this.Socials,
          bookingSocial,
          legacy,
          facebookValue: bookingSocial.facebook,
          instagramValue: bookingSocial.instagram,
          xValue: bookingSocial.x,
          youtubeValue: bookingSocial.youtube,
          tiktokValue: bookingSocial.tiktok,
          linkedinValue: bookingSocial.linkedin
        });
      } catch (e) {
        console.error('Error processing social media data:', e);
        this.Socials = {};
      }
    })
  }
}
