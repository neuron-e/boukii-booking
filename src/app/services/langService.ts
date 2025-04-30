import { Injectable } from "@angular/core";
import { ApiCrudService } from "./crud.service";

@Injectable({
  providedIn: "root",
})
export class LangService {
  private languages: any[] = [];

  constructor(private crudService: ApiCrudService) {
    this.loadLanguages();
  }

  loadLanguages() {
    this.crudService.list("/languages", 1, 1000).subscribe((data) => {
      this.languages = data.data;
    });
  }

  getLanguage(code: string): any {
    const lang = this.languages.find((c) => c.id == +code);
    return lang ? lang.code.toUpperCase() : "NDF";
  }

  getLanguages() {
    return this.languages;
  }
}
