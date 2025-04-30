import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home-course-card',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class CourseCardComponent {
  @Input() data: any
  Week: string[] = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"]
  today = new Date()

  constructor(public translateService: TranslateService) { }

  // Determina si debemos mostrar el curso por intervalos
  shouldDisplayByIntervals(): boolean {
    return this.hasIntervals() && this.data.course_type == 1;
  }

  // Determina si debemos mostrar el curso por semanas (flexible pero sin intervalos)
  shouldDisplayByWeeks(): boolean {
    return !this.hasIntervals() && this.data.is_flexible && this.data.course_type == 1;
  }

  // Determina si debemos mostrar el listado simple de fechas (no flexible, sin intervalos)
  shouldDisplaySimpleDates(): boolean {
    return !this.hasIntervals() && !this.data.is_flexible && this.data.course_type == 1;
  }

  // Método para verificar si el curso tiene intervalos configurados
  hasIntervals(): boolean {
    if (!this.data || !this.data.settings) return false;

    const settings = typeof this.data.settings === 'string'
      ? JSON.parse(this.data.settings)
      : this.data.settings;

    return settings.multipleIntervals && settings.intervals && settings.intervals.length > 0;
  }

  // Método para obtener fechas agrupadas por intervalos
  getIntervalGroups(): any[] {
    if (!this.hasIntervals() || !this.data.course_dates) {
      return [];
    }

    const settings = typeof this.data.settings === 'string'
      ? JSON.parse(this.data.settings)
      : this.data.settings;

    const intervals = settings.intervals || [];
    const result = [];

    // Procesar cada intervalo
    intervals.forEach(interval => {
      // Filtrar fechas de este intervalo que sean futuras
      const intervalDates = this.data.course_dates
        .filter(date => date.interval_id === interval.id && this.compareISOWithToday(date.date))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (intervalDates.length > 0) {
        // Obtener primera y última fecha
        const firstDate = new Date(intervalDates[0].date);
        const lastDate = new Date(intervalDates[intervalDates.length - 1].date);

        // Obtener días de la semana únicos
        const weekdays = this.getUniqueWeekdaysFromDates(intervalDates);

        // Obtener horarios comunes
        const commonTime = this.getCommonTime(intervalDates);

        result.push({
          name: interval.name || 'Intervalo',
          startDate: firstDate,
          endDate: lastDate,
          weekdays: weekdays,
          time: commonTime,
          count: intervalDates.length
        });
      }
    });

    return result;
  }

  // Método para agrupar fechas por semanas cuando es flexible sin intervalos
  getWeekGroups(): any[] {
    if (this.hasIntervals() || !this.data.course_dates) {
      return [];
    }

    // Filtrar solo fechas futuras
    const futureDates = this.data.course_dates
      .filter(date => this.compareISOWithToday(date.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (futureDates.length === 0) {
      return [];
    }

    // Agrupar por semanas
    const weekGroups = [];
    let currentGroup = null;

    futureDates.forEach(date => {
      const dateObj = new Date(date.date);
      // Obtener el lunes de esta semana
      const mondayOfWeek = new Date(dateObj);
      mondayOfWeek.setDate(dateObj.getDate() - dateObj.getDay() + (dateObj.getDay() === 0 ? -6 : 1));
      const mondayString = mondayOfWeek.toISOString().split('T')[0];

      if (!currentGroup || currentGroup.mondayString !== mondayString) {
        // Crear un nuevo grupo para esta semana
        currentGroup = {
          mondayString: mondayString,
          startDate: dateObj,
          endDate: dateObj,
          dates: [date],
          weekdays: [dateObj.getDay()]
        };
        weekGroups.push(currentGroup);
      } else {
        // Añadir a grupo existente
        currentGroup.dates.push(date);
        currentGroup.endDate = dateObj;
        if (!currentGroup.weekdays.includes(dateObj.getDay())) {
          currentGroup.weekdays.push(dateObj.getDay());
        }
      }
    });

    // Procesar los grupos para el formato final
    return weekGroups.map(group => {
      // Calcular la fecha de fin de semana (domingo)
      const endOfWeek = new Date(group.startDate);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - (endOfWeek.getDay() || 7)));

      // Verificar si todas las fechas tienen el mismo horario
      const commonTime = this.getCommonTime(group.dates);

      return {
        name: this.translateService.instant('week_of') + ' ' + this.formatDate(group.startDate),
        startDate: group.startDate,
        endDate: group.dates[group.dates.length - 1].date < endOfWeek ?
          new Date(group.dates[group.dates.length - 1].date) : endOfWeek,
        weekdays: group.weekdays.sort(),
        time: commonTime,
        count: group.dates.length
      };
    });
  }

  // Obtener fechas futuras sin agrupar (para cursos no flexibles sin intervalos)
  getFutureDates(): any[] {
    if (!this.data || !this.data.course_dates) {
      return [];
    }

    return this.data.course_dates
      .filter(date => this.compareISOWithToday(date.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Obtener días de la semana únicos de un conjunto de fechas
  private getUniqueWeekdaysFromDates(dates): number[] {
    const uniqueDays = new Set<number>();

    dates.forEach(date => {
      const day = new Date(date.date).getDay();
      uniqueDays.add(day);
    });

    return Array.from(uniqueDays).sort();
  }

  // Verificar si todas las fechas tienen el mismo horario y retornarlo
  private getCommonTime(dates): string {
    if (!dates || dates.length === 0) return '';

    const firstStartTime = dates[0].hour_start;
    const firstEndTime = dates[0].hour_end;

    const allSameTime = dates.every(date =>
      date.hour_start === firstStartTime && date.hour_end === firstEndTime
    );

    if (allSameTime) {
      return `${firstStartTime}h-${firstEndTime}h`;
    }

    return this.translateService.instant('various_times');
  }

  // Formatear fecha para visualización
  private formatDate(date: Date): string {
    return `${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  }

  // Convertir array de números de días a nombres de días
  formatWeekdays(days: number[]): string {
    if (!days || days.length === 0) return '';

    // Si son todos los días
    if (days.length === 7) {
      return this.translateService.instant('all_days');
    }

    // Si son días laborables
    if (days.length === 5 &&
      days.includes(1) && days.includes(2) && days.includes(3) &&
      days.includes(4) && days.includes(5) &&
      !days.includes(0) && !days.includes(6)) {
      return this.translateService.instant('weekdays');
    }

    // Si es fin de semana
    if (days.length === 2 && days.includes(0) && days.includes(6) &&
      !days.includes(1) && !days.includes(2) && !days.includes(3) &&
      !days.includes(4) && !days.includes(5)) {
      return this.translateService.instant('weekend');
    }

    // Caso general: listar los días
    const dayNames = days.map(day => this.Week[day]);

    if (dayNames.length === 1) {
      return dayNames[0];
    }

    const lastDay = dayNames.pop();
    return dayNames.join(', ') + ' ' + this.translateService.instant('and') + ' ' + lastDay;
  }

  // Métodos existentes
  getWeekDay(): string {
    const uniqueDays: Set<number> = new Set();
    this.data.course_dates.forEach((item: any) => {
      const day = new Date(item.date).getDay();
      uniqueDays.add(day);
    });
    return this.formatWeekdays(Array.from(uniqueDays));
  }

  findMaxHourEnd(): string {
    const maxHourStart = Math.max(
      ...this.data.course_dates.map((date: any) => {
        return parseInt(date.hour_end.replace(":", ""));
      })
    );
    const maxHourString = maxHourStart.toString().padStart(4, "0");
    return `${maxHourString.slice(0, 2)}:${maxHourString.slice(2)}`;
  }

  findMinHourStart(): string {
    const maxHourStart = Math.max(
      ...this.data.course_dates.map((date: any) => {
        return parseInt(date.hour_start.replace(":", ""));
      })
    );
    const minHourString = maxHourStart.toString().padStart(4, "0");
    return `${minHourString.slice(0, 2)}:${minHourString.slice(2)}`;
  }

  getShotrDescription() {
    if (!this.data.translations || this.data.translations === null) {
      return this.data.short_description;
    } else {
      const translations = typeof this.data.translations === 'string' ?
        JSON.parse(this.data.translations) : this.data.translations;
      return translations[this.translateService.currentLang].short_description || this.data.short_description;
    }
  }

  getDescription() {
    if (!this.data.translations || this.data.translations === null) {
      return this.data.description;
    } else {
      const translations = typeof this.data.translations === 'string' ?
        JSON.parse(this.data.translations) : this.data.translations;
      return translations[this.translateService.currentLang]?.description || this.data.description;
    }
  }

  getCourseName() {
    if (!this.data.translations || this.data.translations === null) {
      return this.data.name;
    } else {
      const translations = typeof this.data.translations === 'string' ?
        JSON.parse(this.data.translations) : this.data.translations;
      return translations[this.translateService.currentLang].name || this.data.name;
    }
  }

  getCoursePrice() {
    if (this.data.course_type == 2 && this.data.is_flexible) {
      const priceRange = this.data.price_range.find((a: any) => a[1] !== null);
      return priceRange[1];
    } else {
      return this.data.price
    }
  }

  getCoursePrivateFlexPrice(duration: string = '15min', participants: number = 1) {
    if (this.data.course_type == 2 && this.data.is_flexible) {
      // Buscar la entrada correspondiente a la duración
      const priceEntry = this.data.price_range.find((entry: any) => entry.intervalo === duration);

      if (!priceEntry) {
        return null; // Si no se encuentra la duración, devolver null
      }

      // Obtener el precio basado en el número de participantes
      const price = priceEntry[participants];

      return price ? parseFloat(price) : null; // Convertir a número y devolver, o null si no hay precio
    } else {
      return this.data.price;
    }
  }

  getWeekdays(settings: string): string {
    const settingsObj = typeof settings === 'string' ? JSON.parse(settings) : settings;
    const weekDays = settingsObj.weekDays;
    const daysMap: any = {
      "monday": "Lundi",
      "tuesday": "Mardi",
      "wednesday": "Mercredi",
      "thursday": "Jeudi",
      "friday": "Vendredi",
      "saturday": "Samedi",
      "sunday": "Diamanche",
    };
    const activeDays = Object.entries(weekDays)
      .filter(([_, isActive]) => isActive)
      .map(([day]) => this.translateService.instant(daysMap[day]));

    if (activeDays.length === 7) {
      return `${this.translateService.instant('Lundi')} - ${this.translateService.instant('Diamanche')}`;
    } else {
      return activeDays.join(', ');
    }
  }

  protected readonly JSON = JSON;

  compareISOWithToday(isoDate: string): boolean {
    const isoDateObj = new Date(isoDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isoDateObj >= today;
  }
}
